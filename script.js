// script.js
// Настройка размеров

// Пробуем добавить тестовый SVG

const width = 1200;
const height = 400;
const margin = { top: 30, right: 30, bottom: 50, left: 30 };

// Цвета для периодов
const periodColors = {
  zugot: "#b3cde0",
  tanaim_temple: "#ccebc5",
  tanaim_post_temple: "#fddaec",
  amoraim_eretz_israel: "#decbe4",
  amoraim_bavel: "#fed9a6",
  savoraim: "#ffffcc"
};

// Функция инициализации
async function init() {
  // Загружаем данные
  const data = await d3.json("data.json");

  // У нас в data содержатся:
  // data.periods => массив периодов
  // data.sages => массив мудрецов

  const periods = data.periods;
  const sages = data.sages;

  // Определяем min и max год
  // Для перестраховки возьмём min от ~-350, max до ~650
  const minYear = d3.min([
    d3.min(periods, d => d.start),
    d3.min(sages, s => s.year),
    -350
  ]);
  const maxYear = d3.max([
    d3.max(periods, d => d.end),
    d3.max(sages, s => s.year),
    650
  ]);

  // Создаём шкалу X (год -> пиксели)
  const xScale = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([margin.left, width - margin.right]);

  // Создаём основной SVG
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // === 1) Рисуем ось X ===
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(20).tickFormat(d3.format("d")));

  // === 2) Рисуем цветные прямоугольники для каждого периода ===
  //    Будут растягиваться на всю высоту, кроме небольших отступов.
  //    На одном уровне, чтобы показать «фон» для каждого отрезка времени.
  //    Можно использовать периодId -> periodColors[periodId].
  svg.selectAll(".period-rect")
    .data(periods)
    .enter()
    .append("rect")
    .attr("class", "period-rect")
    .attr("x", d => xScale(d.start))
    .attr("y", margin.top)
    .attr("width", d => xScale(d.end) - xScale(d.start))
    .attr("height", height - margin.bottom - margin.top)
    .attr("fill", d => periodColors[d.id] || "#ccc")
    .attr("opacity", 0.4); // чуть прозрачнее

  // === 3) Подпись названий периодов, примерно по центру периода ===
  svg.selectAll(".period-label")
    .data(periods)
    .enter()
    .append("text")
    .attr("class", "period-label")
    .attr("x", d => (xScale(d.start) + xScale(d.end)) / 2)
    .attr("y", margin.top + 20)
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .text(d => d.name);

  // === 4) Рисуем мудрецов (точки) ===
  //    Все на одной горизонтали (например, posY).
  //    Или, если очень много, можно добавить «случайный разброс» или
  //    «смещение» в зависимости от периода.
  //    Здесь для простоты — одна общая горизонтальная линия.
  const posY = (height - margin.bottom) / 2 + 30;

  svg.selectAll(".sage-circle")
    .data(sages)
    .enter()
    .append("circle")
    .attr("class", "sage-circle")
    .attr("cx", d => xScale(d.year))
    .attr("cy", posY)
    .attr("r", 5)
    .attr("fill", d => periodColors[d.periodId] || "gray")
    .attr("stroke", "#333")
    .attr("stroke-width", 1);

  // === 5) Подписи к точкам (имя мудреца) ===
  //    Ставим чуть выше/ниже точки (чтобы текст не залезал на окружность).
  svg.selectAll(".sage-label")
    .data(sages)
    .enter()
    .append("text")
    .attr("class", "sage-label")
    .attr("x", d => xScale(d.year))
    .attr("y", posY - 10) // на 10px выше точки
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text(d => d.name);

  // Готово! Все имена и точки отображаются на одной шкале.
}

// Запуск
init();
