// script.js

// Попробуем отрисовать сетку, где:
// - Ось Y: периоды (Zugot, Tanaim...).
// - Ось X: поколения.
// В каждой "ячейке" (period, generation) будут имена мудрецов, располагающиеся вертикально.

const width = 1200;
const height = 900;

const margin = { top: 60, right: 60, bottom: 80, left: 150 };

// Базовые цвета для периодов
const baseColors = {
  zugot: "#b3cde0",
  tanaim_temple: "#ccebc5",
  tanaim_post_temple: "#fddaec",
  amoraim_eretz_israel: "#decbe4",
  amoraim_bavel: "#fed9a6",
  savoraim: "#ffffcc"
};

// Немного осветлим/затемним
function tintColor(base, factor = 1) {
  const c = d3.color(base);
  if (!c) return "#ccc";
  // Простой вариант — делаем цвет светлее
  return c.brighter(factor).formatRgb();
}

fetch("data.json")
  .then(r => r.json())
  .then(data => {
    const periods = data.periods;
    const sages = data.sages;

    // Сгруппируем мудрецов по (periodId, groupId)
    // D3 v7: const grouped = d3.group(sages, s => s.periodId, s => s.groupId);
    // Или вручную:
    const grouped = {};
    sages.forEach(s => {
      const keyP = s.periodId;
      const keyG = s.groupId;
      if (!grouped[keyP]) grouped[keyP] = {};
      if (!grouped[keyP][keyG]) grouped[keyP][keyG] = [];
      grouped[keyP][keyG].push(s);
    });

    // Определим уникальные периоды и поколения
    const periodKeys = Array.from(
      new Set(sages.map(d => d.periodId))
    );

    // Чтобы сохранить порядок, посмотрим, есть ли упорядоченный массив "periods"
    // у нас есть periods[].id. Сделаем сортировку periodKeys по порядку, если нужно
    // Сейчас просто оставим как есть.
    // Но лучше:
    const periodOrder = periods.map(p => p.id);
    periodKeys.sort((a, b) => periodOrder.indexOf(a) - periodOrder.indexOf(b));

    // Поколения
    const generationKeys = Array.from(
      new Set(sages.map(d => d.groupId))
    ).sort(); // сортируем строково

    // Шкала X - поколения
    const xScale = d3.scaleBand()
      .domain(generationKeys)
      .range([margin.left, width - margin.right])
      .padding(0.2);

    // Шкала Y - периоды
    const yScale = d3.scaleBand()
      .domain(periodKeys)
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Создадим ячейки для каждой (period, generation)
    // Сформируем массив комбинаций
    const cellsData = [];
    periodKeys.forEach(p => {
      generationKeys.forEach(g => {
        cellsData.push({ period: p, generation: g });
      });
    });

    // Прямоугольники для каждой ячейки
    svg.selectAll(".cell")
      .data(cellsData)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", d => xScale(d.generation))
      .attr("y", d => yScale(d.period))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => {
        // базовый цвет = baseColors[period]
        // для оттенка используем factor = порядковый номер поколения (?
        const base = baseColors[d.period] || "#ccc";
        const idx = generationKeys.indexOf(d.generation); // 0,1,2...
        return tintColor(base, 0.5 + idx * 0.08); // легкий градиент
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8);

    // Подписываем название поколения в центре каждой ячейки
    svg.selectAll(".cell-label-generation")
      .data(cellsData)
      .enter()
      .append("text")
      .attr("class", "cell-label-generation")
      .attr("x", d => xScale(d.generation) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.period) + 15)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#333")
      .text(d => d.generation);

    // Добавим имена мудрецов в каждой ячейке, вертикально друг под другом
    // Для этого нужна вложенная выборка.

    // Группа "cell" для удобства
    const cellGroup = svg.selectAll(".cellGroup")
      .data(cellsData)
      .enter()
      .append("g")
      .attr("class", "cellGroup")
      .attr("transform", d => `translate(${xScale(d.generation)},${yScale(d.period)})`);

    cellGroup.each(function(d) {
      const cell = d3.select(this);
      const arr = grouped[d.period]?.[d.generation] || [];

      // Каждому мудрецу в ячейке даем отдельный <text>
      // Располагаем их вертикально друг под другом
      // lineHeight = 14px
      arr.forEach((sage, i) => {
        cell.append("text")
          .attr("x", xScale.bandwidth() / 2)
          .attr("y", 30 + i * 14) // 30 - отступ сверху, i*14 - шаг
          .attr("text-anchor", "middle")
          .attr("font-size", 10)
          .attr("fill", "#000")
          .text(sage.name);
      });
    });

    // Подпишем периоды слева (ось Y)
    svg.selectAll(".period-label")
      .data(periodKeys)
      .enter()
      .append("text")
      .attr("x", margin.left - 10)
      .attr("y", d => yScale(d) + yScale.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", 14)
      .text(d => {
        const p = periods.find(p => p.id === d);
        return p ? p.name : d;
      });

    // Добавим заголовок
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", 20)
      .text("Еврейская история: Поколения (X) и Периоды (Y)");
  })
  .catch(err => console.error(err));
