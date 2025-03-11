// script.js

// Создадим широкую таблицу (по оси X - периоды, по оси Y - поколения).
// У нас есть data.json, где есть "periods" и "sages".
// Каждый sage имеет periodId и groupId ( "Пара x" или "Поколение x" ).
// Мы построим сетку, а легенду по периодам отобразим наверху.

const width = 1600; // Широкая таблица
const height = 1000;

const margin = { top: 100, right: 60, bottom: 80, left: 180 };

// Базовые цвета для периодов (для легенды и ячеек)
const baseColors = {
  zugot: "#b3cde0",
  tanaim_temple: "#ccebc5",
  tanaim_post_temple: "#fddaec",
  amoraim_eretz_israel: "#decbe4",
  amoraim_bavel: "#fed9a6",
  savoraim: "#ffffcc"
};

// Если в периодах будут новые ID, окрасим в #ccc
function getPeriodColor(periodId) {
  return baseColors[periodId] || "#ccc";
}

// Немного осветлим или затемним
function tintColor(base, factor = 1) {
  const c = d3.color(base);
  if (!c) return "#ccc";
  return c.brighter(factor).formatRgb();
}

fetch("data.json")
  .then(r => r.json())
  .then(data => {
    const periods = data.periods;
    const sages = data.sages;

    // Построим словарь: periodOrder в хрон. порядке
    // У нас periods уже содержит { id, name, start, end }.
    // Отсортируем по start.
    const sortedPeriods = periods.slice().sort((a, b) => a.start - b.start);
    const periodKeys = sortedPeriods.map(p => p.id);

    // Соберем все generations:
    const generationSet = new Set(sages.map(d => d.groupId));
    // Превратим в массив и упорядочим (строково):
    const generationKeys = Array.from(generationSet).sort();

    // Группируем мудрецов: (periodId, generation) -> массив
    const grouped = {};
    sages.forEach(s => {
      const p = s.periodId;
      const g = s.groupId;
      if (!grouped[p]) grouped[p] = {};
      if (!grouped[p][g]) grouped[p][g] = [];
      grouped[p][g].push(s);
    });

    // Создадим шкалы
    // X - периоды
    const xScale = d3.scaleBand()
      .domain(periodKeys)
      .range([margin.left, width - margin.right])
      .padding(0.1);

    // Y - поколения
    const yScale = d3.scaleBand()
      .domain(generationKeys)
      .range([margin.top, height - margin.bottom])
      .padding(0.1);

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Создадим массив ячеек
    const cellsData = [];
    periodKeys.forEach(periodId => {
      generationKeys.forEach(genId => {
        cellsData.push({ periodId, genId });
      });
    });

    // Рисуем ячейки
    svg.selectAll(".cell")
      .data(cellsData)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", d => xScale(d.periodId))
      .attr("y", d => yScale(d.genId))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => {
        // оттенок по поколению
        const base = getPeriodColor(d.periodId);
        const idx = generationKeys.indexOf(d.genId); // 0..N
        return tintColor(base, 0.4 + idx * 0.07);
      })
      .attr("stroke", "#fff");

    // Для каждого cell добавим <g>, куда разместим имена мудрецов
    const cellG = svg.selectAll(".cellGroup")
      .data(cellsData)
      .enter()
      .append("g")
      .attr("class", "cellGroup")
      .attr("transform", d => `translate(${xScale(d.periodId)}, ${yScale(d.genId)})`);

    cellG.each(function(d) {
      const selection = d3.select(this);
      const arr = grouped[d.periodId]?.[d.genId] || [];

      // Высота ячейки:
      const cellH = yScale.bandwidth();
      // Маленький отступ сверху
      const topPad = 5;
      let lineHeight = 14;
      if (arr.length > 0) {
        const totalAvailable = cellH - topPad - 5;
        lineHeight = Math.max(10, totalAvailable / arr.length);
      }

      // Выводим имена вертикально
      arr.forEach((sage, i) => {
        selection.append("text")
          .attr("x", xScale.bandwidth() / 2)
          .attr("y", topPad + (i + 1) * lineHeight)
          .attr("text-anchor", "middle")
          .attr("font-size", 11)
          .attr("fill", "#000")
          .text(sage.name);
      });
    });

    // Подписи по оси X (наверху + снизу) - периоды
    // Можно подписать в центре ячейки, но сделаем наверху.

    // Сверху:
    svg.selectAll(".periodLabelTop")
      .data(periodKeys)
      .enter()
      .append("text")
      .attr("class", "periodLabelTop")
      .attr("x", d => xScale(d) + xScale.bandwidth()/2)
      .attr("y", margin.top - 20)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("font-weight", "bold")
      .text(d => {
        // Найдём название периода
        const per = periods.find(p => p.id === d);
        return per ? per.name : d;
      });

    // Подписи по оси Y - поколения
    svg.selectAll(".genLabel")
      .data(generationKeys)
      .enter()
      .append("text")
      .attr("class", "genLabel")
      .attr("x", margin.left - 10)
      .attr("y", d => yScale(d) + yScale.bandwidth()/2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .text(d => d);

    // Добавим легенду для периодов (цвета)
    // Например, наверху, слева -> рисуем квадратики.

    const legendG = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${margin.left}, ${margin.top - 60})`);

    const legendItem = legendG.selectAll(".legendItem")
      .data(sortedPeriods)
      .enter()
      .append("g")
      .attr("class", "legendItem")
      .attr("transform", (d, i) => `translate(${i*120},0)`);

    legendItem.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", d => getPeriodColor(d.id));

    legendItem.append("text")
      .attr("x", 25)
      .attr("y", 15)
      .attr("font-size", 12)
      .text(d => d.name);

    // Заголовок
    svg.append("text")
      .attr("x", width/2)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("font-size", 20)
      .attr("font-weight", "bold")
      .text("Еврейская история: периоды по оси X, поколения по оси Y");
  })
  .catch(err => console.error(err));
