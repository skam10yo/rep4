#!/usr/bin/env python3
"""Собирает автономный index.html из template.html и медиа из media-src/.

Запуск один раз (или после замены медиа):  python3 build.py
Нужны ffmpeg/ffprobe (для видео) и Pillow (для фото).

Что делает:
  * видео  -> зацикленный клип 5 с (6 с исходника, последняя секунда плавно
              перетекает в начало), 1280 px, без звука, H.264, до 2 МБ,
              плюс кадр-постер WebP для мобильных;
  * фото   -> WebP шириной 1200 px, до 90 КБ;
  * всё встраивается в HTML как data: URI, источники — комментарием в конце.
Если файла нет, слот остаётся на CSS-заглушке, а скрипт перечисляет, чего не хватает.
"""
import base64, io, json, re, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "media-src"
VIDEO_LIMIT = 2 * 1024 * 1024
PHOTO_LIMIT = 90 * 1024
PAGE_LIMIT = 8 * 1024 * 1024


def data_uri(mime, raw):
    return f"data:{mime};base64,{base64.b64encode(raw).decode()}"


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def probe_duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def build_video(cfg, tmp):
    src = SRC / cfg["file"]
    if not src.exists():
        return None, None
    start = float(cfg.get("start", 0))
    dur = probe_duration(src)
    if dur - start < 6:
        start = max(0.0, dur - 6)
    if dur < 3:
        sys.exit(f"Видео {src.name} короче 3 секунд")
    clip = min(6.0, dur - start)
    body, xf = clip - 1.0, 1.0
    vf = (f"[0:v]scale=1280:-2:flags=lanczos,fps=24,format=yuv420p,split[a][b];"
          f"[a]trim=0:{body},setpts=PTS-STARTPTS[main];"
          f"[b]trim={body}:{clip},setpts=PTS-STARTPTS[tail];"
          f"[tail][main]xfade=transition=fade:duration={xf}:offset=0[v]")
    out = tmp / "smoke.mp4"
    for crf in (26, 29, 32, 35, 38, 41):
        run(["ffmpeg", "-y", "-ss", str(start), "-t", str(clip), "-i", str(src), "-filter_complex", vf,
             "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
             "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)])
        if out.stat().st_size <= VIDEO_LIMIT:
            break
    else:
        sys.exit("Видео не удалось ужать до 2 МБ")
    poster = tmp / "poster.webp"
    run(["ffmpeg", "-y", "-i", str(out), "-frames:v", "1", "-vf", "scale=960:-2", "-q:v", "45", str(poster)])
    # кадры для ручной проверки темы
    frames = SRC / "_frames"
    frames.mkdir(exist_ok=True)
    run(["ffmpeg", "-y", "-i", str(out), "-vf", "fps=1,scale=480:-2", str(frames / "frame-%02d.jpg")])
    v, p = out.read_bytes(), poster.read_bytes()
    print(f"  видео {src.name}: {len(v)/1024:.0f} КБ, постер {len(p)/1024:.0f} КБ, crf {crf}; кадры: {frames}")
    return v, p


def build_photo(path):
    from PIL import Image
    with Image.open(path) as im:
        im.verify()
    with Image.open(path) as im:
        im = im.convert("RGB")
        if im.width > 1200:
            im = im.resize((1200, round(im.height * 1200 / im.width)), Image.LANCZOS)
        for q in range(78, 20, -4):
            buf = io.BytesIO()
            im.save(buf, "WEBP", quality=q, method=6)
            if buf.tell() <= PHOTO_LIMIT:
                break
        while buf.tell() > PHOTO_LIMIT:  # крайний случай: уменьшаем размер
            im = im.resize((int(im.width * .85), int(im.height * .85)), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "WEBP", quality=50, method=6)
    print(f"  фото {path.name}: {buf.tell()/1024:.0f} КБ, {im.width}x{im.height}, q{q}")
    return buf.getvalue()


def credit_line(kind, cfg, used):
    if not used:
        return f"  {kind:<14} — нет файла media-src/{cfg['file']}, на странице CSS-заглушка"
    who = cfg.get("author") or "автор не указан"
    return f"  {kind:<14} — {who}; {cfg.get('source') or 'источник не указан'}; {cfg.get('url') or 'ссылка не указана'}"


def main():
    manifest = json.loads((HERE / "media.json").read_text(encoding="utf-8"))
    html = (HERE / "template.html").read_text(encoding="utf-8")
    missing, credits = [], []
    SRC.mkdir(exist_ok=True)
    print("Медиа:")
    with tempfile.TemporaryDirectory() as t:
        video, poster = build_video(manifest["video"], Path(t))
    if video:
        tag = (f'<video class="bg__video" autoplay muted loop playsinline preload="auto" '
               f'poster="{data_uri("image/webp", poster)}" aria-hidden="true" tabindex="-1">'
               f'<source src="{data_uri("video/mp4", video)}" type="video/mp4"></video>')
    else:
        tag = ""
        missing.append(f"media-src/{manifest['video']['file']} — {manifest['video']['brief']}")
    html = html.replace("<!--MEDIA:VIDEO-->", tag)
    credits.append(credit_line("видео: дым", manifest["video"], bool(video)))

    photos = {p["slot"]: p for p in manifest["photos"]}
    built = {}
    for slot, cfg in photos.items():
        path = SRC / cfg["file"]
        if path.exists():
            built[slot] = data_uri("image/webp", build_photo(path))
        else:
            missing.append(f"media-src/{cfg['file']} — {cfg['brief']}")
        credits.append(credit_line(f"фото: {slot}", cfg, slot in built))

    def swap(m):
        slot = m.group(1)
        if slot in built:
            return m.group(0).replace(f'src="media:{slot}"', f'src="{built[slot]}"')
        return '<span class="media__empty" aria-hidden="true"></span>'
    html = re.sub(r'<img\b[^>]*\bsrc="media:([\w-]+)"[^>]*>', swap, html)

    comment = "<!--\nИСТОЧНИКИ МЕДИА\n" + "\n".join(credits) + \
              "\nШрифты: Cormorant Garamond и Manrope, Google Fonts, SIL Open Font License.\n-->"
    html = html.replace("<!--MEDIA:CREDITS-->", comment)
    out = HERE / "index.html"
    out.write_text(html, encoding="utf-8")
    size = out.stat().st_size
    print(f"\nindex.html: {size/1024:.1f} КБ ({size/1024/1024:.2f} МБ)")
    if missing:
        print("\nНе хватает (страница собрана с CSS-заглушками):\n  " + "\n  ".join(missing))
    if size > PAGE_LIMIT:
        sys.exit("Файл больше 8 МБ")


if __name__ == "__main__":
    main()
