export interface Guest {
  nome: string
  telefone: string
  familia: string
}

export const guests: Guest[] = [
  // Família da Noiva
  { nome: "Maria Silva", telefone: "11999990001", familia: "Família Silva" },
  { nome: "José Silva", telefone: "11999990002", familia: "Família Silva" },
  { nome: "Ana Paula Silva", telefone: "11999990003", familia: "Família Silva" },
  { nome: "Carlos Eduardo Silva", telefone: "11999990004", familia: "Família Silva" },
  { nome: "Fernanda Oliveira", telefone: "11999990005", familia: "Família Oliveira" },
  { nome: "Roberto Oliveira", telefone: "11999990006", familia: "Família Oliveira" },

  // Família do Noivo
  { nome: "Antônio Santos", telefone: "11988880001", familia: "Família Santos" },
  { nome: "Lucia Santos", telefone: "11988880002", familia: "Família Santos" },
  { nome: "Pedro Henrique Santos", telefone: "11988880003", familia: "Família Santos" },
  { nome: "Mariana Santos", telefone: "11988880004", familia: "Família Santos" },
  { nome: "Ricardo Pereira", telefone: "11988880005", familia: "Família Pereira" },
  { nome: "Claudia Pereira", telefone: "11988880006", familia: "Família Pereira" },

  // Amigos
  { nome: "Lucas Mendes", telefone: "11977770001", familia: "Amigos" },
  { nome: "Juliana Costa", telefone: "11977770002", familia: "Amigos" },
  { nome: "Thiago Almeida", telefone: "11977770003", familia: "Amigos" },
  { nome: "Beatriz Rocha", telefone: "11977770004", familia: "Amigos" },
  { nome: "Gabriel Lima", telefone: "11977770005", familia: "Amigos" },
  { nome: "Amanda Souza", telefone: "11977770006", familia: "Amigos" },
  { nome: "Rafael Ferreira", telefone: "11977770007", familia: "Amigos" },
  { nome: "Camila Martins", telefone: "11977770008", familia: "Amigos" },
]

export function findGuest(nome: string, telefone: string): Guest | undefined {
  const normalizedNome = nome.trim().toLowerCase()
  const normalizedTelefone = telefone.replace(/\D/g, "")

  return guests.find((guest) => guest.nome.toLowerCase() === normalizedNome && guest.telefone === normalizedTelefone)
}
