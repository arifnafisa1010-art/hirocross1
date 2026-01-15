import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { athleteData, testResults, categoryScores, overallScore } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Kamu adalah seorang ahli ilmu keolahragaan dan sport science yang berpengalaman dalam menganalisis performa atlet. 
Tugasmu adalah memberikan analisis mendalam dan rekomendasi pelatihan berdasarkan hasil tes biomotor atlet.

Berikan analisis dalam format berikut:
1. **Ringkasan Kondisi Fisik**: Gambaran umum kondisi fisik atlet (2-3 kalimat)
2. **Kekuatan Utama**: Aspek biomotor yang menjadi keunggulan atlet (sebutkan 2-3 item terbaik)
3. **Area Pengembangan**: Aspek yang perlu ditingkatkan dengan prioritas (sebutkan 2-3 item dengan skor terendah)
4. **Rekomendasi Latihan**: 3-5 rekomendasi latihan spesifik untuk meningkatkan performa
5. **Catatan Penting**: Hal-hal yang perlu diperhatikan pelatih dalam program latihan

Gunakan bahasa Indonesia yang profesional dan mudah dipahami. Berikan analisis yang spesifik berdasarkan data yang diberikan.`;

    const userPrompt = `Analisis performa atlet berikut:

**Data Atlet:**
- Nama: ${athleteData.name}
- Usia: ${athleteData.age} tahun
- Jenis Kelamin: ${athleteData.gender === 'M' ? 'Laki-laki' : 'Perempuan'}
- Cabang Olahraga: ${athleteData.sport || 'Tidak disebutkan'}
- Berat Badan: ${athleteData.weight || '-'} kg
- Tinggi Badan: ${athleteData.height || '-'} cm

**Skor Keseluruhan:** ${overallScore}/5

**Ringkasan Kategori Biomotor:**
${categoryScores.map((c: any) => `- ${c.category}: ${c.score}/5`).join('\n')}

**Detail Hasil Tes:**
${testResults.map((r: any) => `- ${r.item} (${r.category}): ${r.value} ${r.unit} → Skor ${r.score}/5`).join('\n')}

Berikan analisis komprehensif dan rekomendasi latihan yang spesifik untuk atlet ini.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-athlete function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
