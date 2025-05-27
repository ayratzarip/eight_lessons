const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create modules with their images and descriptions
  const modules = [
    {
      title: 'Общая теория',
      description: 'Изучите фундаментальные принципы эффективного общения в профессиональной среде.',
      image: '/assets/theory.png',
      lessons: [
        { title: 'Введение в коммуникацию', order: 1 },
        { title: 'Вербальное и невербальное общение', order: 2 },
        { title: 'Активное слушание', order: 3 }
      ]
    },
    {
      title: 'Фокус внимания',
      description: 'Освойте техники разрешения конфликтов и ведения сложных переговоров.',
      image: '/assets/attention.png',
      lessons: [
        { title: 'Природа конфликтов', order: 1 },
        { title: 'Стратегии разрешения конфликтов', order: 2 },
        { title: 'Медиация и фасилитация', order: 3 }
      ]
    },
    {
      title: 'Мысли',
      description: 'Развивайте навыки лидерства и научитесь оказывать позитивное влияние на команду.',
      image: '/assets/thoughts.png',
      lessons: [
        { title: 'Развитие лидерских качеств', order: 1 },
        { title: 'Управление командой', order: 2 }
      ]
    },
    {
      title: 'Телесные ощущения',
      description: 'Преодолейте страх публичных выступлений и научитесь уверенно выступать перед аудиторией.',
      image: '/assets/body.png',
      lessons: [
        { title: 'Работа с телом', order: 1 },
        { title: 'Контроль физических реакций', order: 2 }
      ]
    },
    {
      title: 'Стиль',
      description: 'Научитесь распознавать и управлять эмоциями для улучшения взаимодействия с окружающими.',
      image: '/assets/style.png',
      lessons: [
        { title: 'Персональный стиль коммуникации', order: 1 },
        { title: 'Адаптация стиля к аудитории', order: 2 }
      ]
    },
    {
      title: 'Текст',
      description: 'Освойте искусство построения профессиональных связей и расширения деловой сети.',
      image: '/assets/text.png',
      lessons: [
        { title: 'Структура текста', order: 1 },
        { title: 'Навыки письменной коммуникации', order: 2 }
      ]
    },
    {
      title: 'Мимика',
      description: 'Развивайте навыки анализа информации и принятия обоснованных решений.',
      image: '/assets/mimic.png',
      lessons: [
        { title: 'Выразительная мимика', order: 1 },
        { title: 'Считывание эмоций по мимике', order: 2 }
      ]
    },
    {
      title: 'Пантомимика',
      description: 'Изучите методы эффективного управления временем и повышения продуктивности.',
      image: '/assets/pantomime.png',
      lessons: [
        { title: 'Язык тела', order: 1 },
        { title: 'Невербальные сигналы', order: 2 }
      ]
    },
    {
      title: 'Голос',
      description: 'Научитесь быстро адаптироваться к изменениям и развивайте гибкость мышления.',
      image: '/assets/voice.png',
      lessons: [
        { title: 'Техники речи', order: 1 },
        { title: 'Интонация и темп', order: 2 }
      ]
    }
  ];

  // Create modules and their lessons in the database
  for (const moduleData of modules) {
    const { title, description, image, lessons } = moduleData;
    
    const module = await prisma.module.create({
      data: {
        title,
        description,
        image
      },
    });

    // Create lessons for this module
    if (lessons && lessons.length > 0) {
      for (const lessonData of lessons) {
        await prisma.lesson.create({
          data: {
            title: lessonData.title,
            moduleId: module.id,
            order: lessonData.order
          },
        });
      }
    }
  }

  console.log('Database has been seeded with modules and lessons!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });