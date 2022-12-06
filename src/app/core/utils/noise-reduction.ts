type Point = {
  x: number;
  y: number;
  color?: string;
};

/********** 以下直接引用源碼 http://mourner.github.io/simplify-js/ ***********/
/**
 * 取得點至線段距離的平方
 * @param p {Point}
 * @param p1 {Point}
 * @param p2 {Point}
 */
function getSqSegDist(p: Point, p1: Point, p2: Point) {
  let x = p1.x,
    y = p1.y,
    dx = p2.x - x,
    dy = p2.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2.x;
      y = p2.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;

  return dx * dx + dy * dy;
}

/**
 * Ramer-Douglas-Peucker 演算法
 * @param points {Array<Point>}
 * @param first {number}-線段第一點
 * @param last {number}-線段最後一點
 * @param sqTolerance {number}-公差平方
 * @param simplified {Array<Point>}-降噪結果
 */
function simplifyDPStep(
  points: Array<Point>,
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Array<Point>
) {
  let maxSqDist = sqTolerance;
  let index = 0;

  // 先找出離線最遠的點
  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);
    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  // 如果最遠點大於所設定之公差平方才進行降噪
  if (maxSqDist > sqTolerance) {
    if (index > first + 1) {
      simplified = simplifyDPStep(points, first, index, sqTolerance, simplified);
    }

    simplified.push(points[index]);

    if (last > index + 1) {
      simplified = simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
  }

  return simplified;
}

/**
 * 使用 Ramer-Douglas-Peucker 演算法
 * @param points {Array<Point>}
 * @param sqTolerance {number}-公差平方
 */
function simplifyDouglasPeucker(points: Array<Point>, sqTolerance: number) {
  const last = points.length - 1;
  let simplified = [points[0]];

  simplified = simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);

  return simplified;
}

/**
 * points 降噪
 * @param points {Array<Point>}
 * @param tolerance {number}-簡化的公差
 */
export function simplify(points: Array<Point>, tolerance: number) {
  if (points.length <= 2) {
    return points;
  }

  const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
  points = simplifyDouglasPeucker(points, sqTolerance);

  return points;
}
