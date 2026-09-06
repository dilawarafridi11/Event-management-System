/**
 * EVENTIFY - Pure Vanilla JavaScript Canvas Chart Engine
 * High-performance, responsive HTML5 Canvas charts with tooltips, animations, and dark/light mode support.
 * Zero external dependencies.
 */

const Charts = {
  // Color Palettes
  getThemeColors() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return {
      textColor: isLight ? '#475569' : '#94a3b8',
      textMuted: isLight ? '#94a3b8' : '#64748b',
      gridColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
      tooltipBg: isLight ? '#ffffff' : '#1f293d',
      tooltipText: isLight ? '#0f172a' : '#f8fafc',
      tooltipBorder: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.12)',
      primary: '#6366f1',
      primaryGlow: 'rgba(99, 102, 241, 0.25)',
      secondary: '#8b5cf6',
      pink: '#ec4899',
      cyan: '#06b6d4',
      emerald: '#10b981',
      amber: '#f59e0b',
      palette: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6', '#14b8a6']
    };
  },

  // High-DPI Canvas Setup helper
  setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.parentElement.clientWidth || 400;
    const height = rect.height || canvas.parentElement.clientHeight || 260;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width, height, dpr };
  },

  // 1. Line Chart (Event Bookings Overview)
  renderLineChart(canvasId, labels, dataPoints, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    let hoverIndex = -1;
    let animProgress = 0;
    let animId = null;

    const colors = this.getThemeColors();
    const title = options.title || 'Bookings';

    const draw = () => {
      const { ctx, width, height } = this.setupCanvas(canvas);
      ctx.clearRect(0, 0, width, height);

      const padLeft = 45;
      const padRight = 20;
      const padTop = 30;
      const padBottom = 40;
      const chartW = width - padLeft - padRight;
      const chartH = height - padTop - padBottom;

      const maxVal = Math.max(...dataPoints, 10) * 1.15;
      const minVal = 0;

      // Draw horizontal grid lines & Y-axis labels
      const gridSteps = 4;
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = colors.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= gridSteps; i++) {
        const yVal = Math.round(minVal + (maxVal - minVal) * (i / gridSteps));
        const yPos = padTop + chartH - (i / gridSteps) * chartH;

        ctx.strokeStyle = colors.gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padLeft, yPos);
        ctx.lineTo(width - padRight, yPos);
        ctx.stroke();

        ctx.fillText(yVal.toString(), padLeft - 8, yPos);
      }

      // Calculate Coordinates
      const points = dataPoints.map((val, idx) => {
        const x = padLeft + (idx / (dataPoints.length - 1)) * chartW;
        const currentVal = val * animProgress;
        const y = padTop + chartH - ((currentVal - minVal) / (maxVal - minVal)) * chartH;
        return { x, y, val };
      });

      // Draw Area Gradient Under Curve
      const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.00)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, padTop + chartH);
      ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(points[points.length - 1].x, padTop + chartH);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw Smooth Line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw X-axis labels and points
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = colors.textColor;

      points.forEach((pt, idx) => {
        // Label
        ctx.fillText(labels[idx], pt.x, padTop + chartH + 10);

        // Circle point
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, hoverIndex === idx ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = hoverIndex === idx ? '#ffffff' : colors.primary;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = colors.secondary;
        ctx.stroke();
      });

      // Draw Tooltip on Hover
      if (hoverIndex >= 0 && hoverIndex < points.length) {
        const pt = points[hoverIndex];
        const tipText = `${labels[hoverIndex]}: ${pt.val} ${title}`;
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        const textWidth = ctx.measureText(tipText).width;
        const tipW = textWidth + 18;
        const tipH = 28;
        let tipX = pt.x - tipW / 2;
        let tipY = pt.y - tipH - 12;

        if (tipX < padLeft) tipX = padLeft;
        if (tipX + tipW > width - padRight) tipX = width - padRight - tipW;
        if (tipY < 5) tipY = pt.y + 12;

        // Tooltip box
        ctx.fillStyle = colors.tooltipBg;
        ctx.strokeStyle = colors.tooltipBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tipX, tipY, tipW, tipH, 6);
        ctx.fill();
        ctx.stroke();

        // Tooltip text
        ctx.fillStyle = colors.tooltipText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tipText, tipX + tipW / 2, tipY + tipH / 2);
      }
    };

    // Mouse interactivity
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const chartW = rect.width - 65;
      const step = chartW / (dataPoints.length - 1);

      let closestIdx = -1;
      let minDistance = 25;

      dataPoints.forEach((_, idx) => {
        const ptX = 45 + idx * step;
        const dist = Math.abs(mouseX - ptX);
        if (dist < minDistance) {
          closestIdx = idx;
        }
      });

      if (hoverIndex !== closestIdx) {
        hoverIndex = closestIdx;
        draw();
      }
    };

    const onMouseLeave = () => {
      hoverIndex = -1;
      draw();
    };

    canvas.removeEventListener('mousemove', canvas._mouseMoveHandler);
    canvas.removeEventListener('mouseleave', canvas._mouseLeaveHandler);
    canvas._mouseMoveHandler = onMouseMove;
    canvas._mouseLeaveHandler = onMouseLeave;
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // Animation loop
    const animate = () => {
      animProgress += 0.05;
      if (animProgress >= 1) {
        animProgress = 1;
        draw();
      } else {
        draw();
        animId = requestAnimationFrame(animate);
      }
    };
    animate();

    // Auto update on theme change
    window.addEventListener('themeChanged', () => draw());
  },

  // 2. Bar Chart (Monthly Revenue Overview)
  renderBarChart(canvasId, labels, dataPoints, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    let hoverIndex = -1;
    let animProgress = 0;

    const colors = this.getThemeColors();
    const prefix = options.prefix || 'PKR ';

    const draw = () => {
      const { ctx, width, height } = this.setupCanvas(canvas);
      ctx.clearRect(0, 0, width, height);

      const padLeft = 55;
      const padRight = 20;
      const padTop = 30;
      const padBottom = 40;
      const chartW = width - padLeft - padRight;
      const chartH = height - padTop - padBottom;

      const maxVal = Math.max(...dataPoints, 100) * 1.15;
      const gridSteps = 4;

      // Draw Grid & Y-Axis
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = colors.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      for (let i = 0; i <= gridSteps; i++) {
        const yVal = Math.round((maxVal / gridSteps) * i);
        const yPos = padTop + chartH - (i / gridSteps) * chartH;

        ctx.strokeStyle = colors.gridColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padLeft, yPos);
        ctx.lineTo(width - padRight, yPos);
        ctx.stroke();

        ctx.fillText(`${prefix}${yVal >= 1000 ? (yVal/1000).toFixed(1) + 'k' : yVal}`, padLeft - 8, yPos);
      }

      // Bar layout calculations
      const totalBars = dataPoints.length;
      const slotWidth = chartW / totalBars;
      const barWidth = Math.min(slotWidth * 0.55, 38);

      const bars = [];

      dataPoints.forEach((val, idx) => {
        const barHeight = (val / maxVal) * chartH * animProgress;
        const x = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
        const y = padTop + chartH - barHeight;

        bars.push({ x, y, w: barWidth, h: barHeight, val, label: labels[idx] });

        // Bar Gradient
        const barGrad = ctx.createLinearGradient(0, y, 0, padTop + chartH);
        if (hoverIndex === idx) {
          barGrad.addColorStop(0, '#8b5cf6');
          barGrad.addColorStop(1, '#6366f1');
        } else {
          barGrad.addColorStop(0, '#6366f1');
          barGrad.addColorStop(1, 'rgba(99, 102, 241, 0.4)');
        }

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        // X label
        ctx.fillStyle = colors.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(labels[idx], x + barWidth / 2, padTop + chartH + 10);
      });

      // Tooltip
      if (hoverIndex >= 0 && hoverIndex < bars.length) {
        const b = bars[hoverIndex];
        const tipText = `${b.label}: ${prefix}${b.val.toLocaleString()}`;
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        const textWidth = ctx.measureText(tipText).width;
        const tipW = textWidth + 18;
        const tipH = 28;
        let tipX = b.x + b.w / 2 - tipW / 2;
        let tipY = b.y - tipH - 8;

        if (tipX < padLeft) tipX = padLeft;
        if (tipX + tipW > width - padRight) tipX = width - padRight - tipW;
        if (tipY < 5) tipY = b.y + 10;

        ctx.fillStyle = colors.tooltipBg;
        ctx.strokeStyle = colors.tooltipBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tipX, tipY, tipW, tipH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = colors.tooltipText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tipText, tipX + tipW / 2, tipY + tipH / 2);
      }
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const chartW = rect.width - 75;
      const slotWidth = chartW / dataPoints.length;

      let idx = Math.floor((mouseX - 55) / slotWidth);
      if (idx < 0 || idx >= dataPoints.length) idx = -1;

      if (hoverIndex !== idx) {
        hoverIndex = idx;
        draw();
      }
    };

    const onMouseLeave = () => {
      hoverIndex = -1;
      draw();
    };

    canvas.removeEventListener('mousemove', canvas._mouseMoveHandler);
    canvas.removeEventListener('mouseleave', canvas._mouseLeaveHandler);
    canvas._mouseMoveHandler = onMouseMove;
    canvas._mouseLeaveHandler = onMouseLeave;
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const animate = () => {
      animProgress += 0.06;
      if (animProgress >= 1) {
        animProgress = 1;
        draw();
      } else {
        draw();
        requestAnimationFrame(animate);
      }
    };
    animate();

    window.addEventListener('themeChanged', () => draw());
  },

  // 3. Donut Chart (Event Categories Distribution)
  renderDonutChart(canvasId, labels, dataPoints, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    let hoverIndex = -1;
    let animProgress = 0;

    const colors = this.getThemeColors();
    const sliceColors = options.colors || colors.palette;
    const total = dataPoints.reduce((a, b) => a + b, 0);

    const draw = () => {
      const { ctx, width, height } = this.setupCanvas(canvas);
      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.4;
      const centerY = height * 0.5;
      const radius = Math.min(centerX, centerY) - 18;
      const innerRadius = radius * 0.62;

      let startAngle = -Math.PI / 2;
      const slices = [];

      dataPoints.forEach((val, idx) => {
        const sliceAngle = (val / total) * (Math.PI * 2) * animProgress;
        const endAngle = startAngle + sliceAngle;
        const isHovered = hoverIndex === idx;

        slices.push({
          startAngle,
          endAngle,
          idx,
          label: labels[idx],
          val,
          color: sliceColors[idx % sliceColors.length]
        });

        const r = isHovered ? radius + 5 : radius;
        const ir = isHovered ? innerRadius - 2 : innerRadius;

        ctx.beginPath();
        ctx.arc(centerX, centerY, r, startAngle, endAngle);
        ctx.arc(centerX, centerY, ir, endAngle, startAngle, true);
        ctx.closePath();

        ctx.fillStyle = sliceColors[idx % sliceColors.length];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isHovered ? '#ffffff' : (document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#111827');
        ctx.stroke();

        startAngle = endAngle;
      });

      // Center text in Donut
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 16px "Space Grotesk", sans-serif';
      ctx.fillStyle = colors.tooltipText;
      ctx.fillText(`${total}`, centerX, centerY - 6);

      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = colors.textMuted;
      ctx.fillText('Events', centerX, centerY + 12);

      // Draw Side Legends
      const legendX = width * 0.76;
      let legendY = 30;
      const rowHeight = 24;

      labels.forEach((label, idx) => {
        const color = sliceColors[idx % sliceColors.length];
        const pct = Math.round((dataPoints[idx] / total) * 100);

        // Legend square
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(legendX - 18, legendY - 6, 10, 10, 2);
        ctx.fill();

        // Legend label & percentage
        ctx.font = hoverIndex === idx ? 'bold 12px "Plus Jakarta Sans", sans-serif' : '11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = hoverIndex === idx ? colors.tooltipText : colors.textColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${label} (${pct}%)`, legendX, legendY);

        legendY += rowHeight;
      });
    };

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const centerX = rect.width * 0.4;
      const centerY = rect.height * 0.5;
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = Math.min(centerX, centerY) - 18;

      let idx = -1;

      if (dist >= radius * 0.5 && dist <= radius + 10) {
        let angle = Math.atan2(dy, dx);
        if (angle < -Math.PI / 2) angle += Math.PI * 2;
        // Shift angle by +PI/2
        let normAngle = angle + Math.PI / 2;
        if (normAngle < 0) normAngle += Math.PI * 2;

        let curAngle = 0;
        for (let i = 0; i < dataPoints.length; i++) {
          const sliceA = (dataPoints[i] / total) * Math.PI * 2;
          if (normAngle >= curAngle && normAngle <= curAngle + sliceA) {
            idx = i;
            break;
          }
          curAngle += sliceA;
        }
      }

      if (hoverIndex !== idx) {
        hoverIndex = idx;
        draw();
      }
    };

    const onMouseLeave = () => {
      hoverIndex = -1;
      draw();
    };

    canvas.removeEventListener('mousemove', canvas._mouseMoveHandler);
    canvas.removeEventListener('mouseleave', canvas._mouseLeaveHandler);
    canvas._mouseMoveHandler = onMouseMove;
    canvas._mouseLeaveHandler = onMouseLeave;
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const animate = () => {
      animProgress += 0.05;
      if (animProgress >= 1) {
        animProgress = 1;
        draw();
      } else {
        draw();
        requestAnimationFrame(animate);
      }
    };
    animate();

    window.addEventListener('themeChanged', () => draw());
  }
};
