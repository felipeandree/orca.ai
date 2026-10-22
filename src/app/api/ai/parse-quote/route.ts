import { NextResponse } from "next/server";

const MATERIAL_KEYWORDS = [
  "cabo",
  "fio",
  "fios",
  "disjuntor",
  "disjuntores",
  "tomada",
  "tomadas",
  "interruptor",
  "tubo",
  "tubulação",
  "cobre",
  "suporte",
  "gás",
  "fluido",
  "capacitor",
  "contatora",
  "tinta",
  "massa",
  "lixa",
  "fita",
  "material",
  "materiais",
  "peça",
  "peças",
  "kit",
  "cano",
  "registro",
  "válvula",
  "lâmpada",
  "led",
  "spot",
  "spots",
  "dr",
  "dps",
  "parafuso",
  "bucha",
];

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Digite ou cole a descrição do orçamento." },
        { status: 400 }
      );
    }

    let workingText = text.trim();

    // 1. Extrair telefone (ex: (11) 98888-7777 ou 11988887777)
    let clientPhone = "";
    const phoneMatch = workingText.match(
      /(?:\(?(\d{2})\)?\s*)?(?:9\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})/
    );
    if (phoneMatch) {
      clientPhone = phoneMatch[0].replace(/\D/g, "");
      workingText = workingText.replace(phoneMatch[0], " ");
    }

    // 2. Extrair desconto se houver (ex: "desconto de 50", "desconto 30 reais")
    let discount = 0;
    const discountMatch = workingText.match(
      /desconto\s*(?:de)?\s*(?:r\$)?\s*(\d+(?:[.,]\d+)?)\s*(?:reais|conto)?/i
    );
    if (discountMatch) {
      discount = parseFloat(discountMatch[1].replace(",", "."));
      workingText = workingText.replace(discountMatch[0], " ");
    }

    // 3. Extrair endereço básico (Rua ..., Av ..., Avenida ..., Condomínio ...)
    let clientAddress = "";
    const addressMatch = workingText.match(
      /(?:na\s+|em\s+|endereço[:\s]+)?((?:rua|av\.?|avenida|alameda|travessa|condom[ií]nio)\s+[^,;\n:]+(?:\s*,?\s*(?:n[º°]?\s*)?\d+)?)/i
    );
    if (addressMatch) {
      clientAddress = addressMatch[1].trim();
      workingText = workingText.replace(addressMatch[0], " ");
    }

    // 4. Extrair nome do cliente (ex: "Cliente João Silva", "pro Carlos", "para Dona Maria:")
    let clientName = "";
    const nameMatch = workingText.match(
      /(?:orçamento\s+)?(?:para\s+o?\s*|pro\s+|pra\s+|cliente[:\s]+)((?:sr\.?\s*|sra\.?\s*|dona\s*|dr\.?\s*|dra\.?\s*)?[A-ZÀ-Úa-zà-ú]+(?:\s+[A-ZÀ-Úa-zà-ú]+){0,2}?)(?=\s*(?:[,:\-\n]|instalar|trocar|fazer|pintar|manutenção|limpeza|higienização|reparo|serviço|\d|$))/i
    );
    if (nameMatch) {
      const candidate = nameMatch[1].trim();
      if (
        candidate.length >= 2 &&
        !/^(instalar|trocar|pintar|fazer|orcamento|orçamento)$/i.test(candidate)
      ) {
        clientName = candidate
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        workingText = workingText.replace(nameMatch[0], " ");
      }
    }

    // 5. Separar cláusulas de itens (por quebra de linha, ponto-e-vírgula, vírgula ou " + " / " e ")
    const segments = workingText
      .replace(/^[\s,:\-;]+/, "")
      .split(/(?:\n|;|\+|,(?!\d)|\s+e\s+(?=[^,]*?\d))/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);

    const parsedItems: {
      description: string;
      type: "SERVICE" | "MATERIAL";
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const seg of segments) {
      // Procurar valor monetário no segmento (ex: "150 cada", "R$ 200", "200 reais", "por 180", ou número no final)
      let unitPrice = 0;
      let cleanDesc = seg;

      const priceRegex =
        /(?:por\s+|a\s+|de\s+|valor\s+)?(?:r\$\s*)?(\d+(?:[.,]\d+)?)\s*(?:reais|conto|cada|un|m2|m²)?\s*(?:cada)?$/i;
      const priceAnywhereRegex =
        /(?:r\$\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:reais|cada))/i;

      const endMatch = cleanDesc.match(priceRegex);
      if (endMatch) {
        unitPrice = parseFloat(endMatch[1].replace(",", "."));
        cleanDesc = cleanDesc.replace(endMatch[0], "").trim();
      } else {
        const anyMatch = cleanDesc.match(priceAnywhereRegex);
        if (anyMatch) {
          const valStr = anyMatch[1] || anyMatch[2];
          unitPrice = parseFloat(valStr.replace(",", "."));
          cleanDesc = cleanDesc.replace(anyMatch[0], "").trim();
        }
      }

      // Procurar quantidade no início ou meio (ex: "2 ventiladores", "instalar 3 split", "4x tomadas", "50m2 pintura")
      let quantity = 1;
      const qtyStartMatch = cleanDesc.match(
        /^(\d+)\s*(?:x|un|unidades|m2|m²|metros)?\s+(?:de\s+)?(.+)/i
      );
      const qtyVerbMatch = cleanDesc.match(
        /^([a-zà-ú]+\s+(?:de\s+)?)(\d+)\s*(?:x|un|m2|m²)?\s+(.+)/i
      );

      if (qtyStartMatch) {
        quantity = parseInt(qtyStartMatch[1], 10) || 1;
        cleanDesc = qtyStartMatch[2].trim();
      } else if (qtyVerbMatch) {
        quantity = parseInt(qtyVerbMatch[2], 10) || 1;
        cleanDesc = `${qtyVerbMatch[1]}${qtyVerbMatch[3]}`.trim();
      }

      // Limpar pontuações residuais
      cleanDesc = cleanDesc
        .replace(/^[\s,\-:;]+|[\s,\-:;]+$/g, "")
        .replace(/\s{2,}/g, " ");

      if (!cleanDesc && unitPrice === 0) continue;

      if (!cleanDesc) {
        cleanDesc = "Serviço / Material";
      } else {
        cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
      }

      // Classificar entre SERVICE ou MATERIAL
      const lower = cleanDesc.toLowerCase();
      const isMaterial =
        MATERIAL_KEYWORDS.some((kw) => lower.includes(kw)) &&
        !/^(instala|troca|manuten|reparo|limpeza|higieniza|mão de obra|pintura)/i.test(
          lower
        );

      parsedItems.push({
        description: cleanDesc,
        type: isMaterial ? "MATERIAL" : "SERVICE",
        quantity,
        unitPrice,
      });
    }

    if (parsedItems.length === 0) {
      parsedItems.push({
        description: workingText.charAt(0).toUpperCase() + workingText.slice(1),
        type: "SERVICE",
        quantity: 1,
        unitPrice: 0,
      });
    }

    // Construir título inteligente a partir dos primeiros itens
    const title = parsedItems
      .slice(0, 2)
      .map((i) =>
        i.quantity > 1 ? `${i.quantity}x ${i.description}` : i.description
      )
      .join(" + ");

    return NextResponse.json({
      clientName,
      clientPhone,
      clientAddress,
      title,
      discount,
      items: parsedItems,
    });
  } catch (error) {
    console.error("AI Parse error:", error);
    return NextResponse.json(
      { error: "Não foi possível interpretar o texto." },
      { status: 500 }
    );
  }
}
