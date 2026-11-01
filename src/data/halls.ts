export type HallId = 'main' | 'private' | 'veranda';

export const halls: { id: HallId; photo: string; title: string; capacity: string; maxGuests: number; minOrder: string; text: string; season?: string }[] = [
  {
    id: 'main', photo: 'hall-main', title: 'Общий зал', capacity: 'до 40 гостей', maxGuests: 12,
    minOrder: 'Не установлен',
    text: 'Двенадцать столов на расстоянии друг от друга, глубокие диваны и тихая музыка — разговору ничто не мешает.',
  },
  {
    id: 'private', photo: 'hall-private', title: 'Приватная комната', capacity: '6–8 гостей', maxGuests: 8,
    minOrder: 'от 8\u202f000\u00a0₽',
    text: 'Отдельная комната с дверью, своим светом и плейлистом. Для дня рождения, встречи старых друзей или долгого разговора.',
  },
  {
    id: 'veranda', photo: 'hall-veranda', title: 'Летняя веранда', capacity: 'до 24 гостей', maxGuests: 10,
    minOrder: 'Не установлен', season: 'Открыта с мая по сентябрь',
    text: 'Под навесом, среди растений и гирлянд. Пледы на прохладные вечера выдаём без просьб.',
  },
];
