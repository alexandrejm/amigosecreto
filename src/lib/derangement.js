export function sattoloShuffle(array) {
  const arr = [...array];
  let i = arr.length;
  
  while (i > 1) {
    const j = Math.floor(Math.random() * (i - 1));
    i--;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr;
}

export function generateDerangement(participants) {
  if (participants.length < 3) {
    throw new Error('Mínimo de 3 participantes necessário');
  }

  const shuffled = sattoloShuffle(participants);
  
  for (let i = 0; i < shuffled.length; i++) {
    if (shuffled[i].id === participants[i].id) {
      throw new Error('Falha no derangement - autoatribuição detectada');
    }
  }
  
  return shuffled;
}

export function createAssignments(participants) {
  const seed = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const deranged = generateDerangement(participants);
  
  const assignments = participants.map((giver, index) => ({
    id: `assign_${Date.now()}_${index}`,
    giverId: giver.id,
    receiverId: deranged[index].id,
    createdAt: new Date().toISOString()
  }));
  
  return { assignments, seed };
}