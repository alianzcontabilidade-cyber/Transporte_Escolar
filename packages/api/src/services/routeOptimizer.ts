// ============================================
// SERVIÇO DE OTIMIZAÇÃO DE ROTAS E ANÁLISE DE ALUNOS
// ============================================

interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface StopPoint extends GeoPoint {
  id: number;
  name: string;
}

interface StudentPoint extends GeoPoint {
  id: number;
  name: string;
}

// ============================================
// HAVERSINE - Distância entre dois pontos (km)
// ============================================
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================
// DISTÂNCIA TOTAL DE UMA ROTA (km)
// ============================================
export function totalRouteDistance(stops: GeoPoint[]): number {
  if (stops.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversineDistance(
      stops[i].latitude, stops[i].longitude,
      stops[i + 1].latitude, stops[i + 1].longitude
    );
  }
  return Math.round(total * 100) / 100;
}

// ============================================
// NEAREST-NEIGHBOR TSP (algoritmo guloso)
// ============================================
export function optimizeStopOrder(stops: StopPoint[]): {
  optimizedStops: StopPoint[];
  originalDistance: number;
  optimizedDistance: number;
  savingsPercent: number;
} {
  if (stops.length <= 2) {
    const dist = totalRouteDistance(stops);
    return {
      optimizedStops: [...stops],
      originalDistance: dist,
      optimizedDistance: dist,
      savingsPercent: 0,
    };
  }

  const originalDistance = totalRouteDistance(stops);

  // Nearest-neighbor: começa pela primeira parada (ponto de partida fixo)
  const visited = new Set<number>();
  const result: StopPoint[] = [];
  let current = stops[0];
  result.push(current);
  visited.add(0);

  while (visited.size < stops.length) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < stops.length; i++) {
      if (visited.has(i)) continue;
      const d = haversineDistance(
        current.latitude, current.longitude,
        stops[i].latitude, stops[i].longitude
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    if (nearestIdx >= 0) {
      visited.add(nearestIdx);
      current = stops[nearestIdx];
      result.push(current);
    }
  }

  const optimizedDistance = totalRouteDistance(result);
  const savingsPercent = originalDistance > 0
    ? Math.round(((originalDistance - optimizedDistance) / originalDistance) * 10000) / 100
    : 0;

  return {
    optimizedStops: result,
    originalDistance,
    optimizedDistance,
    savingsPercent: Math.max(0, savingsPercent),
  };
}

// ============================================
// CLUSTERIZAÇÃO DE ALUNOS (k-means simplificado)
// ============================================
export function clusterStudents(
  students: StudentPoint[],
  numClusters: number
): { clusters: { center: GeoPoint; students: StudentPoint[] }[] } {
  if (students.length === 0) return { clusters: [] };

  const k = Math.min(numClusters, students.length);

  // Inicializar centros com k alunos espaçados uniformemente
  const step = Math.max(1, Math.floor(students.length / k));
  let centers: GeoPoint[] = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.min(i * step, students.length - 1);
    centers.push({
      latitude: students[idx].latitude,
      longitude: students[idx].longitude,
    });
  }

  // Iterar k-means (max 20 iterações)
  let assignments: number[] = new Array(students.length).fill(0);

  for (let iter = 0; iter < 20; iter++) {
    let changed = false;

    // Atribuir cada aluno ao centro mais próximo
    for (let i = 0; i < students.length; i++) {
      let minDist = Infinity;
      let bestCluster = 0;
      for (let c = 0; c < centers.length; c++) {
        const d = haversineDistance(
          students[i].latitude, students[i].longitude,
          centers[c].latitude, centers[c].longitude
        );
        if (d < minDist) {
          minDist = d;
          bestCluster = c;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
    }

    if (!changed) break;

    // Recalcular centros
    const newCenters: { sumLat: number; sumLng: number; count: number }[] =
      Array.from({ length: k }, () => ({ sumLat: 0, sumLng: 0, count: 0 }));

    for (let i = 0; i < students.length; i++) {
      const c = assignments[i];
      newCenters[c].sumLat += students[i].latitude;
      newCenters[c].sumLng += students[i].longitude;
      newCenters[c].count++;
    }

    centers = newCenters.map((nc, idx) => {
      if (nc.count === 0) return centers[idx]; // manter centro antigo se vazio
      return {
        latitude: Math.round((nc.sumLat / nc.count) * 100000000) / 100000000,
        longitude: Math.round((nc.sumLng / nc.count) * 100000000) / 100000000,
      };
    });
  }

  // Montar resultado
  const clusterMap: Map<number, StudentPoint[]> = new Map();
  for (let i = 0; i < students.length; i++) {
    const c = assignments[i];
    if (!clusterMap.has(c)) clusterMap.set(c, []);
    clusterMap.get(c)!.push(students[i]);
  }

  const clusters = Array.from(clusterMap.entries())
    .map(([idx, studs]) => ({
      center: centers[idx],
      students: studs,
    }))
    .filter(c => c.students.length > 0);

  return { clusters };
}

// ============================================
// ANÁLISE COMPLETA DE UMA ROTA
// ============================================
export function analyzeRoute(
  route: { id: number; name: string; totalDistanceKm?: string | number | null },
  stops: StopPoint[],
  _students: StudentPoint[]
): {
  currentDistance: number;
  optimizedDistance: number;
  savingsKm: number;
  savingsPercent: number;
  optimizedOrder: number[];
  suggestions: string[];
  score: number;
} {
  // Filtrar paradas sem coordenadas válidas
  const validStops = stops.filter(s =>
    s.latitude != null && s.longitude != null &&
    !isNaN(s.latitude) && !isNaN(s.longitude) &&
    s.latitude !== 0 && s.longitude !== 0
  );

  if (validStops.length < 2) {
    return {
      currentDistance: 0,
      optimizedDistance: 0,
      savingsKm: 0,
      savingsPercent: 0,
      optimizedOrder: validStops.map(s => s.id),
      suggestions: validStops.length === 0
        ? ['Nenhuma parada com coordenadas GPS cadastradas. Adicione coordenadas para otimizar.']
        : ['Apenas uma parada com coordenadas. Adicione mais paradas para otimizar.'],
      score: 0,
    };
  }

  const { optimizedStops, originalDistance, optimizedDistance, savingsPercent } =
    optimizeStopOrder(validStops);

  const savingsKm = Math.round((originalDistance - optimizedDistance) * 100) / 100;

  // Gerar sugestões
  const suggestions: string[] = [];
  if (savingsPercent > 20) {
    suggestions.push(`A rota pode ser reduzida em ${savingsPercent.toFixed(1)}% (${savingsKm.toFixed(1)} km). Recomendamos aplicar a otimização.`);
  } else if (savingsPercent > 5) {
    suggestions.push(`Economia moderada possível: ${savingsPercent.toFixed(1)}% (${savingsKm.toFixed(1)} km).`);
  } else {
    suggestions.push('A rota já está bem otimizada.');
  }

  // Verificar paradas muito próximas (< 200m)
  for (let i = 0; i < validStops.length; i++) {
    for (let j = i + 1; j < validStops.length; j++) {
      const d = haversineDistance(
        validStops[i].latitude, validStops[i].longitude,
        validStops[j].latitude, validStops[j].longitude
      );
      if (d < 0.2) {
        suggestions.push(
          `Paradas "${validStops[i].name}" e "${validStops[j].name}" estão a apenas ${(d * 1000).toFixed(0)}m de distância. Considere unificá-las.`
        );
      }
    }
  }

  // Verificar distância total da rota registrada vs calculada
  if (route.totalDistanceKm) {
    const registered = parseFloat(String(route.totalDistanceKm));
    if (!isNaN(registered) && registered > 0) {
      const diff = Math.abs(registered - originalDistance);
      if (diff > registered * 0.3) {
        suggestions.push(
          `Distância registrada (${registered.toFixed(1)} km) difere significativamente da calculada (${originalDistance.toFixed(1)} km). Verifique as coordenadas.`
        );
      }
    }
  }

  // Calcular score (0-100, maior = melhor otimizada)
  let score = 100;
  if (savingsPercent > 30) score -= 40;
  else if (savingsPercent > 20) score -= 30;
  else if (savingsPercent > 10) score -= 20;
  else if (savingsPercent > 5) score -= 10;

  // Penalizar se muitas paradas sem alunos associados
  if (_students.length === 0 && validStops.length > 3) {
    score -= 10;
    suggestions.push('Nenhum aluno com coordenadas GPS nesta rota. Cadastre endereços com GPS para melhor análise.');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    currentDistance: originalDistance,
    optimizedDistance,
    savingsKm: Math.max(0, savingsKm),
    savingsPercent: Math.max(0, savingsPercent),
    optimizedOrder: optimizedStops.map(s => s.id),
    suggestions,
    score,
  };
}
