// Размеры svg
const width = 800;
const height = 200;
const margin = { top: 20, right: 20, bottom: 40, left: 20 };

// Создаём глобальную переменную для tooltip (подсказки)
const tooltip = d3.select("#tooltip");

// Функция инициализации
async function init() {
  // 1. Загрузка данных
  const data = await d3.json("data.json");

  // Извлекаем периоды и мудрецов
  const periods = data.periods;
  const sages = data.sages;

  // 2. Определим диапазон годов (минимальный и максимальный)
  // Чтобы уместить все периоды и мудрецов.
  // Найдём минимальный start среди всех periods и минимальный year среди sages
  const minYear = d3.min([
    d3.min(periods, d => d.start),
    d3.min(sages, s => s.year)
  ]);
  // Аналогично для максимального
  const maxYear = d3.max([
    d3.max(periods, d => d.end),
    d3.max(sages, s => s.year)
  ]);

  // 3. Создаём шкалу X (scale)
  // Преобразует год (например -150, 0, 200, 600) в пиксели (от margin.left до width - margin.right)
  const xScale = d3.scaleLinear()
    .domain([minYear, maxYear])
    .range([margin.left, width - margin.right]);

  // 4. Создадим <svg> внутри #chart
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // 5. Добавим ось X (внизу)
  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format("d")));
    // tickFormat(d3.format("d")) убирает десятичные и показывает целые годы

  // 6. Отобразим периоды (прямоугольники)
  //    Каждый период: координата x = xScale(start), ширина = xScale(end) - xScale(start)
  //    Расположим прямоугольники чуть выше оси X
  const rectHeight = 30;
  const rectY = (height - margin.bottom) / 2 - rectHeight / 2; 
  // чтобы они были примерно по середине SVG

  svg.selectAll(".period-rect")
    .data(periods)
    .join("rect")
    .attr("class", "period-rect")
    .attr("x", d => xScale(d.start))
    .attr("y", rectY)
    .attr("width", d => xScale(d.end) - xScale(d.start))
    .attr("height", rectHeight)
    .attr("fill", "#b3cde0") 
    .on("mouseover", (event, d) => {
      // При наведении показываем tooltip
      showTooltip(event, `Период: ${d.name}<br>
                          Годы: ${d.start} – ${d.end}`);
    })
    .on("mousemove", (event, d) => {
      moveTooltip(event);
    })
    .on("mouseout", () => hideTooltip());

  // 7. Отобразим мудрецов в виде кружков (circles)
  //    Координата x = xScale(sage.year), y выберем чуть выше оси, чтобы они были над прямоугольниками
  svg.selectAll(".sage-circle")
    .data(sages)
    .join("circle")
    .attr("class", "sage-circle")
    .attr("cx", d => xScale(d.year))
    .attr("cy", rectY) // Можно сместить чуть вверх/вниз
    .attr("r", 6)
    .attr("fill", "#fbb4ae")
    .on("mouseover", (event, d) => {
      // При наведении
      const html = `<strong>${d.name}</strong><br>
                    Год: ${d.year}<br>
                    Период: ${d.periodId}<br>
                    <em>${d.bio}</em>`;
      showTooltip(event, html);
    })
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);
}

// Функции для tooltip
function showTooltip(event, html) {
  tooltip
    .style("opacity", 1)
    .html(html);

  moveTooltip(event);
}

function moveTooltip(event) {
  // Позиционируем tooltip чуть правее курсора
  const padding = 10;
  tooltip
    .style("left", (event.pageX + padding) + "px")
    .style("top",  (event.pageY + padding) + "px");
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}

// Запускаем
init();
