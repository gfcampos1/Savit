/**
 * Savit Smart Capture — PT-BR natural language parser
 * Extracts date/time/category/priority hints from free-text input.
 * S2 / Feature F1.
 */
(function () {
    'use strict';

    const DOW = {
        dom: 0, domingo: 0,
        seg: 1, segunda: 1, 'segunda-feira': 1, segundafeira: 1,
        ter: 2, terca: 2, 'terca-feira': 2, tercafeira: 2,
        qua: 3, quarta: 3, 'quarta-feira': 3, quartafeira: 3,
        qui: 4, quinta: 4, 'quinta-feira': 4, quintafeira: 4,
        sex: 5, sexta: 5, 'sexta-feira': 5, sextafeira: 5,
        sab: 6, sabado: 6
    };

    function stripDiacritics(s) {
        return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function lower(s) {
        return stripDiacritics(s.toLowerCase());
    }

    function startOfDay(d) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
    }

    function thisOrNextDow(target, base) {
        const d = startOfDay(base || new Date());
        const diff = (target - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + (diff || 7));
        return d;
    }

    function findRelativeDay(text) {
        const phrases = [
            { re: /\bdepois de amanha\b/, days: 2 },
            { re: /\bamanha\b/, days: 1 },
            { re: /\bhoje\b/, days: 0 },
        ];
        const lo = lower(text);
        for (const p of phrases) {
            const m = lo.match(p.re);
            if (m) {
                const d = startOfDay(new Date());
                d.setDate(d.getDate() + p.days);
                return { kind: 'date', raw: text.substr(m.index, m[0].length), range: [m.index, m.index + m[0].length], value: d };
            }
        }
        return null;
    }

    function findDayOfWeek(text) {
        const lo = lower(text);
        const dowKeys = Object.keys(DOW).join('|');

        // próxima/próximo segunda
        let re = new RegExp(`\\b(?:proxima|proximo|prox)\\s+(${dowKeys})\\b`);
        let m = lo.match(re);
        if (m) {
            const d = thisOrNextDow(DOW[m[1]]);
            return { kind: 'date', raw: text.substr(m.index, m[0].length), range: [m.index, m.index + m[0].length], value: d };
        }

        // bare dow
        re = new RegExp(`\\b(${dowKeys})\\b`);
        m = lo.match(re);
        if (m) {
            const target = DOW[m[1]];
            const today = new Date().getDay();
            const d = startOfDay(new Date());
            const diff = (target - today + 7) % 7;
            d.setDate(d.getDate() + (diff === 0 ? 7 : diff)); // bare dow always means next occurrence
            return { kind: 'date', raw: text.substr(m.index, m[0].length), range: [m.index, m.index + m[0].length], value: d };
        }

        return null;
    }

    function findDaqui(text) {
        const lo = lower(text);
        const re = /\bdaqui\s+(\d+)\s*(min|minutos?|h|horas?|dias?|semanas?)\b/;
        const m = lo.match(re);
        if (!m) return null;
        const n = parseInt(m[1], 10);
        const unit = m[2];
        const d = new Date();
        if (unit === 'min' || unit.startsWith('minuto')) d.setMinutes(d.getMinutes() + n);
        else if (unit === 'h' || unit.startsWith('hora')) d.setHours(d.getHours() + n);
        else if (unit.startsWith('dia')) { d.setDate(d.getDate() + n); d.setHours(9, 0, 0, 0); }
        else if (unit.startsWith('semana')) { d.setDate(d.getDate() + n * 7); d.setHours(9, 0, 0, 0); }
        return { kind: 'date', raw: text.substr(m.index, m[0].length), range: [m.index, m.index + m[0].length], value: d };
    }

    function findExplicitDate(text) {
        const re = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;
        const m = text.match(re);
        if (!m) return null;
        const day = parseInt(m[1], 10);
        const month = parseInt(m[2], 10) - 1;
        let year = m[3] ? (m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10)) : new Date().getFullYear();
        if (day < 1 || day > 31 || month < 0 || month > 11) return null;
        let d = new Date(year, month, day);
        // If date is already past and no explicit year given, advance to next year
        if (!m[3]) {
            const todayStart = startOfDay(new Date());
            if (d < todayStart) {
                year += 1;
                d = new Date(year, month, day);
            }
        }
        return { kind: 'date', raw: m[0], range: [m.index, m.index + m[0].length], value: d };
    }

    function findTime(text) {
        // Explicit time: "às 14h", "14h", "9h30", "14:00", "9:30"
        const re = /\b(?:as\s+)?(\d{1,2})[h:](\d{0,2})\b/i;
        const lo = lower(text);
        const m = lo.match(re);
        if (m) {
            const h = parseInt(m[1], 10);
            const mm = m[2] ? parseInt(m[2], 10) : 0;
            if (h >= 0 && h <= 23 && mm >= 0 && mm <= 59) {
                return { kind: 'time', raw: text.substr(m.index, m[0].length), range: [m.index, m.index + m[0].length], value: { h, m: mm } };
            }
        }

        // manha/tarde/noite — convenções 9h/14h/20h
        const periods = [
            { word: 'manha', h: 9 },
            { word: 'tarde', h: 14 },
            { word: 'noite', h: 20 },
        ];
        for (const p of periods) {
            const re2 = new RegExp(`\\b${p.word}\\b`);
            const mm = lo.match(re2);
            if (mm) {
                return { kind: 'time', raw: text.substr(mm.index, mm[0].length), range: [mm.index, mm.index + mm[0].length], value: { h: p.h, m: 0 } };
            }
        }

        return null;
    }

    function findCategory(text, categories) {
        if (!categories || !categories.length) return null;
        const re = /#([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]+)/;
        const m = text.match(re);
        if (!m) return null;
        const tagNorm = lower(m[1]);
        const cat = categories.find(c => lower(c.name || '') === tagNorm);
        if (!cat) return null;
        return { kind: 'category', raw: m[0], range: [m.index, m.index + m[0].length], value: cat };
    }

    function findPriority(text) {
        const m = text.match(/(\!{1,3})\s*$/);
        if (!m) return null;
        const n = m[1].length;
        const value = n === 1 ? 'low' : n === 2 ? 'med' : 'high';
        return { kind: 'priority', raw: m[0], range: [m.index, m.index + m[0].length], value };
    }

    function buildDueAt(datePart, timePart) {
        if (!datePart && !timePart) return null;
        let d;
        if (datePart) {
            d = new Date(datePart.value);
            if (timePart) {
                d.setHours(timePart.value.h, timePart.value.m, 0, 0);
            } else {
                // Only default to 9am if the date is at midnight (no time encoded)
                const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
                if (!hasTime) d.setHours(9, 0, 0, 0);
            }
        } else {
            d = new Date();
            d.setHours(timePart.value.h, timePart.value.m, 0, 0);
            if (d < new Date()) d.setDate(d.getDate() + 1);
        }
        return d;
    }

    function parse(text, categories) {
        if (!text || typeof text !== 'string') {
            return { cleanText: '', parts: [], isTask: false, dueAt: null, categoryId: null, priority: null };
        }

        const parts = [];
        const datePart =
            findRelativeDay(text) ||
            findDaqui(text) ||
            findExplicitDate(text) ||
            findDayOfWeek(text);
        if (datePart) parts.push(datePart);

        const timePart = findTime(text);
        // Avoid mistaking the date "30/4" as time — drop time if its range overlaps date range
        if (timePart && datePart && rangesOverlap(timePart.range, datePart.range)) {
            // skip time
        } else if (timePart) {
            parts.push(timePart);
        }

        const catPart = findCategory(text, categories);
        if (catPart) parts.push(catPart);

        const prioPart = findPriority(text);
        if (prioPart) parts.push(prioPart);

        const dueAt = buildDueAt(datePart, parts.includes(timePart) ? timePart : null);

        // Build cleanText by stripping matched ranges (descending order)
        const sorted = parts.slice().sort((a, b) => b.range[0] - a.range[0]);
        let cleanText = text;
        for (const p of sorted) {
            cleanText = cleanText.slice(0, p.range[0]) + cleanText.slice(p.range[1]);
        }
        cleanText = cleanText.replace(/\s+/g, ' ').trim();

        return {
            cleanText,
            parts,
            isTask: !!dueAt,
            dueAt,
            categoryId: catPart ? catPart.value.id : null,
            priority: prioPart ? prioPart.value : null,
        };
    }

    function rangesOverlap(a, b) {
        return a[0] < b[1] && b[0] < a[1];
    }

    function chipLabel(part) {
        if (!part) return '';
        if (part.kind === 'date') {
            const d = part.value;
            const today = startOfDay(new Date());
            const target = startOfDay(d);
            const diffDays = Math.round((target - today) / 86400000);
            if (diffDays === 0) return 'Hoje';
            if (diffDays === 1) return 'Amanhã';
            if (diffDays === -1) return 'Ontem';
            if (diffDays > 1 && diffDays < 7) {
                return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
            }
            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
        if (part.kind === 'time') {
            const { h, m } = part.value;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
        if (part.kind === 'category') return '#' + (part.value.name || '');
        if (part.kind === 'priority') {
            return part.value === 'high' ? 'Alta' : part.value === 'med' ? 'Média' : 'Baixa';
        }
        return part.raw;
    }

    function chipIcon(part) {
        if (!part) return '';
        if (part.kind === 'date') return 'fa-calendar-day';
        if (part.kind === 'time') return 'fa-clock';
        if (part.kind === 'category') return 'fa-folder';
        if (part.kind === 'priority') return 'fa-flag';
        return 'fa-tag';
    }

    window.ParseNatural = { parse, chipLabel, chipIcon };
})();
