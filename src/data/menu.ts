export type Strength = 'light' | 'medium' | 'strong';
export type Category = 'fruit' | 'berry' | 'citrus' | 'dessert' | 'fresh' | 'signature';

export const strengths: Record<Strength, { label: string; level: number }> = {
  light: { label: 'Лёгкая', level: 1 },
  medium: { label: 'Средняя', level: 2 },
  strong: { label: 'Крепкая', level: 3 },
};

export const categories: Record<Category, { label: string; note: string }> = {
  fruit: { label: 'Фруктовые', note: 'Спелые, сочные, с мягкой сладостью' },
  berry: { label: 'Ягодные', note: 'Яркая кислинка и глубокий цвет' },
  citrus: { label: 'Цитрусовые', note: 'Звонкие, с горчинкой цедры' },
  dessert: { label: 'Десертные', note: 'Сливочные, пряные, обволакивающие' },
  fresh: { label: 'Свежие', note: 'Прохладные травы и холодок' },
  signature: { label: 'Авторские миксы', note: 'Сочетания, которые придумали наши мастера' },
};

export const bowls = [
  { name: 'Классический', price: 1800, note: 'Глиняная чаша, любой вкус из карты' },
  { name: 'Авторский', price: 2200, note: 'Микс от мастера под ваше настроение' },
  { name: 'На фрукте', price: 2600, note: 'Чаша из грейпфрута, ананаса или граната' },
];

export const flavors: { name: string; category: Category; strength: Strength; taste: string }[] = [
  { name: 'Белый персик', category: 'fruit', strength: 'light', taste: 'Бархатный персик с цветочной нотой и медовым послевкусием.' },
  { name: 'Груша и лимонник', category: 'fruit', strength: 'medium', taste: 'Сочная груша, тонкая травяная свежесть, мягкий финиш.' },
  { name: 'Манго–маракуйя', category: 'fruit', strength: 'strong', taste: 'Плотный тропический вкус с терпкой кислинкой маракуйи.' },
  { name: 'Лесная земляника', category: 'berry', strength: 'light', taste: 'Душистая ягода, как из летнего леса, — сладко и нежно.' },
  { name: 'Чёрная смородина', category: 'berry', strength: 'medium', taste: 'Глубокая ягода с лёгкой терпкостью листа.' },
  { name: 'Вишня и какао', category: 'berry', strength: 'strong', taste: 'Тёмная вишня, горький шоколад, долгий насыщенный финиш.' },
  { name: 'Юдзу', category: 'citrus', strength: 'light', taste: 'Японский цитрус: между мандарином и грейпфрутом.' },
  { name: 'Розовый грейпфрут', category: 'citrus', strength: 'medium', taste: 'Сочная мякоть, приятная горчинка и бодрый аромат.' },
  { name: 'Бергамот', category: 'citrus', strength: 'strong', taste: 'Цедра бергамота, как в хорошем чае, — строго и благородно.' },
  { name: 'Ванильный крем', category: 'dessert', strength: 'light', taste: 'Нежный заварной крем и стручок ванили.' },
  { name: 'Солёная карамель', category: 'dessert', strength: 'medium', taste: 'Тягучая карамель с щепоткой морской соли.' },
  { name: 'Пряный чай', category: 'dessert', strength: 'strong', taste: 'Корица, кардамон, гвоздика и тёплое молоко.' },
  { name: 'Мята и огурец', category: 'fresh', strength: 'light', taste: 'Чистая прохлада и хрусткая зелень.' },
  { name: 'Эвкалипт', category: 'fresh', strength: 'medium', taste: 'Глубокий холодок с хвойной ноткой.' },
  { name: 'Ледяной тархун', category: 'fresh', strength: 'strong', taste: 'Анисовая сладость тархуна и ощутимый холод.' },
  { name: 'Медный закат', category: 'signature', strength: 'light', taste: 'Абрикос, облепиха и капля мёда.' },
  { name: 'Тёплый вечер', category: 'signature', strength: 'medium', taste: 'Печёное яблоко, корица и сливочная ваниль.' },
  { name: 'Тлеющий уголь', category: 'signature', strength: 'strong', taste: 'Чёрный чай, дымная слива и ветивер — фирменный микс дома.' },
];
