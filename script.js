// script.js

// Здесь мы разделяем логику для Зугот ("Пара") и остальных периодов ("Поколение").
// Если в данных у Tanaim/Amoraim есть "Пара 3" в groupId, мы можем динамически переименовать.

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

// Немного осветлим цвет
function tintColor(base, factor = 1) {
  const c = d3.color(base);
  if (!c) return "#ccc";
  return c.brighter(factor).formatRgb();
}

// Функция, которая решает, как подписывать группу
// Если period = 'zugot', то пишем "Пара"
// Иначе "Поколение".
function labelForCell(periodId, groupId) {
  if (periodId === "zugot") {
    // Если groupId уже содержит "Пара", вернём как есть, иначе добавим
    return groupId.startsWith("Пара") ? groupId : "Пара " + groupId;
  } else {
    // Для всех остальных периодов
    return groupId.startsWith("Поколение") ? groupId : "Поколение " + groupId;
  }
}

fetch("data.json")
  .then(r => r.json())
  .then(data => {
    const periods = data.periods;
    const sages = data.sages;

    // Группируем мудрецов: (periodId, groupId)
    const grouped = {};
    sages.forEach(s => {
      const keyP = s.periodId;
      const keyG = s.groupId;
      if (!grouped[keyP]) grouped[keyP] = {};
      if (!grouped[keyP][keyG]) grouped[keyP][keyG] = [];
      grouped[keyP][keyG].push(s);
    });

    // Периоды в правильном порядке (по массиву periods)
    const periodOrder = periods.map(p => p.id);
    // Уникальные periodId, отсортированные
    const periodKeys = Array.from(new Set(sages.map(d => d.periodId)));
    periodKeys.sort((a, b) => periodOrder.indexOf(a) - periodOrder.indexOf(b));

    // Уникальные groupId, сортируем строково
    const generationKeys = Array.from(new Set(sages.map(d => d.groupId))).sort();

    // Шкала X – для groupId ("поколения" или "пары")
    const xScale = d3.scaleBand()
      .domain(generationKeys)
      .range([margin.left, width - margin.right])
      .padding(0.2);

    // Шкала Y – для periodId
    const yScale = d3.scaleBand()
      .domain(periodKeys)
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Массив ячеек (period, generation)
    const cellsData = [];
    periodKeys.forEach(p => {
      generationKeys.forEach(g => {
        cellsData.push({ period: p, generation: g });
      });
    });

    // Прямоугольники – ячейки
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
        const base = baseColors[d.period] || "#ccc";
        const idx = generationKeys.indexOf(d.generation);
        // небольшой градиент по поколениям
        return tintColor(base, 0.5 + idx * 0.08);
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8);

    // Подпишем ("поколение" или "пара") вверху ячейки
    svg.selectAll(".cell-label-generation")
      .data(cellsData)
      .enter()
      .append("text")
      .attr("class", "cell-label-generation")
      .attr("x", d => xScale(d.generation) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.period) + 12)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#333")
      .text(d => labelForCell(d.period, d.generation));

    // Создаём <g> для каждой ячейки, чтобы разместить имена
    const cellGroup = svg.selectAll(".cellGroup")
      .data(cellsData)
      .enter()
      .append("g")
      .attr("class", "cellGroup")
      .attr("transform", d => `translate(${xScale(d.generation)}, ${yScale(d.period)})`);

    cellGroup.each(function(d) {
      const cell = d3.select(this);
      const arr = grouped[d.period]?.[d.generation] || [];

      // Высота ячейки
      const cellH = yScale.bandwidth();
      // Оставим небольшой верхний отступ (25px)
      const topPad = 25;
      // Рассчитаем, какое расстояние между строками, чтобы влезли все
      let lineHeight = 14;
      if (arr.length > 0) {
        const totalAvailable = cellH - topPad - 5; // 5 - запас
        // Среднее расстояние, но не меньше 10
        lineHeight = Math.max(10, totalAvailable / arr.length);
      }

      arr.forEach((sage, i) => {
        cell.append("text")
          .attr("x", xScale.bandwidth() / 2)
          .attr("y", topPad + (i + 1) * lineHeight)
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
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

    // Заголовок сверху
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", 20)
      .text("Еврейская история: Поколения / Пары (X) и Периоды (Y)");
  })
  .catch(err => console.error(err));
