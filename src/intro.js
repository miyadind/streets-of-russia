const Intro = {
  scrollY: 0,
  finished: false,
  lines: null,

  text: `Россия. 2026 год.

Телевизоры уже давно говорят громче людей.

Каждый вечер они объясняют стране, кого бояться, кого ненавидеть и почему завтра снова нужно потерпеть.

Страх стал привычкой.
Ложь стала основой жизни.
Люди молчат, чтобы выжить.

На улицах больше нет пикетов.
Нет несогласных.
Нет голосов, звучащих вслух.

Не потому что все смирились.
А потому что каждый слишком хорошо знает цену лишнему слову.

Эта страна могла быть счастливой.

Люди могли смотреть в завтрашний день без страха.
Смеяться.
Строить планы.
Жить свободно.
Говорить правду, не боясь за свою жизнь.

Но этому не дали случиться.

Шаг за шагом страну захватила преступная группировка тварей.

Они протянули свои грязные руки во власть, в школы, в университеты, в суды, в средства массовой информации, в армию и полицию.

Правда стала преступлением.

Годы страха, пропаганды и насилия превратили страну в огромную тюрьму.

Улицы заполнили силовики, доносчики, продажные чиновники и зомбированные толпы.
Тех, кто не согласен, ломают, давят, убивают или заставляют исчезнуть.

Казалось, надежды больше нет.

Лучшие давно покинули этот мир.
Те, кто говорил правду.
Те, кто не боялся.
Те, кто отдал свои жизни за свободу.

Но у людей осталось кое-что, чего не отнять ни силой, ни болью, ни ложью.

Вера в светлое будущее.

И однажды эта вера совершила невозможное.

Где-то на краю страны загорается первый сигнал.
Сначала почти незаметный.

Один человек останавливается.
Рядом встаёт второй.
Потом третий.

И вдруг становится ясно: страх больше не держит всех сразу.

Потом вспыхивает целый город, и народ забирает контроль в свои руки.
Потом другой город очищается от тварей.
А затем — город за городом, округ за округом.

Народная сила, которую считали навсегда утерянной, начинает расти.

Один город вспоминает, что у него есть голос.
Другой — что у него есть имя.
Третий — что страх можно вернуть тем, кто его раздавал.

И в этот момент каждый чувствует внутри себя силу тех, кто уже однажды заплатил за правду слишком дорогую цену.

Герои, отдавшие свои жизни в борьбе за свободу, возвращаются в сердца людей.

Не как легенды.
Не как тени прошлого.

А как внутренний свет, дающий надежду и силу.

Теперь люди выходят на улицы России, чтобы вернуть себе то, что у них украли.

Впереди — оцепления, тёмные дворы, продажные чиновники, приспешники режима и те, кто годами прятался за портретами, погонами и экранной ложью.

Это путь тех, кому больше нечего терять.
Путь тех, кто больше не может терпеть.

Путь очищения страны от паразитов на её теле.

Диктатор и его твари ещё думают, что всё под контролем.

Но они ошибаются.

Это не просто борьба.

Это надежда, которую невозможно отнять у человека, однажды ощутившего свободу внутри себя.

В каждом теперь есть герой, способный противостоять режиму зла.

Это Streets of Russia.`,

  reset() {
    this.scrollY = 0;
    this.finished = false;
    this.lines = null;
  },

  finish(game) {
    if (this.finished) return;
    this.finished = true;
    AudioManager.playSfx('menuSelect', 0.85);
    game.setState('characterSelect');
  },

  update(game, dt) {
    if (Input.consume('escape')) {
      AudioManager.playSfx('menuSelect', 0.75);
      game.setState('mainMenu');
      return;
    }

    const skip = Input.consume('enter') || Input.consume('space') || Input.consumePointer();
    if (skip) {
      this.finish(game);
      return;
    }

    const speed = Input.pressed('arrowdown') || Input.pressed('s') ? 90 : 24;
    this.scrollY += speed * (dt / 1000);
  },

  getWrappedLines(ctx) {
    if (this.lines) return this.lines;

    const maxWidth = 900;
    const paragraphs = this.text.split('\n');
    const lines = [];

    paragraphs.forEach((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        lines.push('');
        return;
      }

      const words = trimmed.split(/\s+/);
      let line = '';

      words.forEach((word) => {
        const testLine = line ? line + ' ' + word : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      });

      if (line) lines.push(line);
    });

    this.lines = lines;
    return lines;
  },

  draw(ctx, images) {
    if (images.main) ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0.95)');
    gradient.addColorStop(0.15, 'rgba(0,0,0,0.15)');
    gradient.addColorStop(0.82, 'rgba(0,0,0,0.1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(130, 84, 1020, 530);
    ctx.clip();

    ctx.font = '26px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1f1f1';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 4;

    const lines = this.getWrappedLines(ctx);
    let y = 130 - this.scrollY;
    const lineHeight = 34;

    lines.forEach((line) => {
      if (y > 55 && y < 640) {
        if (line === 'Россия. 2026 год.' || line === 'Это Streets of Russia.') {
          ctx.font = 'bold 34px Arial';
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.font = '26px Arial';
          ctx.fillStyle = '#f1f1f1';
        }
        ctx.strokeText(line, GAME_CONFIG.width / 2, y);
        ctx.fillText(line, GAME_CONFIG.width / 2, y);
      }
      y += line === '' ? lineHeight * 0.75 : lineHeight;
    });

    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(330, 638, 620, 46);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(330, 638, 620, 46);
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ENTER / SPACE / КЛИК — ПРОПУСТИТЬ   •   ↓ — БЫСТРЕЕ   •   ESC — НАЗАД', GAME_CONFIG.width / 2, 668);
    ctx.textAlign = 'left';
  }
};
