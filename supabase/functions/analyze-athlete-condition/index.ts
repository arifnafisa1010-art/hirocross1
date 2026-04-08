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
    const { athleteData, trainingMetrics, readinessData, acwrData, testResults } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Kamu adalah ahli sport science yang menganalisis kondisi terkini atlet berdasarkan data monitoring.
Berikan analisis singkat dan actionable dalam bahasa Indonesia.

Format respons (gunakan markdown):
## 🏋️ Status Kondisi
Satu paragraf ringkasan kondisi fisik atlet saat ini.

## 📊 Analisis Detail
- **Beban Latihan**: Analisis tren beban dan ACWR
- **Readiness**: Analisis kesiapan fisik berdasarkan data readiness
- **Profil Biomotor**: Analisis kekuatan dan kelemahan dari hasil tes

## 💡 Rekomendasi
3-5 rekomendasi spesifik dan actionable untuk minggu ini.

## ⚠️ Perhatian
Hal-hal yang perlu diwaspadai.

Gunakan bahasa yang profesional tapi mudah dipahami. Berikan analisis berdasarkan data yang tersedia saja.`;

    const readinessInfo = readinessData?.latest
      ? `- Skor Readiness Terbaru: ${readinessData.latest.score} (${readinessData.latest.date})
- Trend Readiness (5 terakhir): ${readinessData.recentScores?.join(', ') || 'N/A'}
- VJ Hari Ini: ${readinessData.latest.vjToday} cm, HR Hari Ini: ${readinessData.latest.hrToday} bpm`
      : '- Data readiness belum tersedia';

    const testInfo = testResults?.length > 0
      ? testResults.map((t: any) => `- ${t.item} (${t.category}): ${t.value} ${t.unit} → Skor ${t.score}/5`).join('\n')
      : '- Data tes biomotor belum tersedia';

    const userPrompt = `Analisis kondisi terkini atlet:

**Profil Atlet:**
- Nama: ${athleteData.name}
- Cabang Olahraga: ${athleteData.sport || 'Tidak disebutkan'}
- Posisi: ${athleteData.position || '-'}
- Berat: ${athleteData.weight || '-'} kg, Tinggi: ${athleteData.height || '-'} cm

**Metrik Beban Latihan:**
- ACWR: ${acwrData?.acwr || 0} (Zona: ${acwrData?.riskZone || 'N/A'})
- Beban Akut (7 hari): ${acwrData?.acuteLoad || 0}
- Beban Kronik (28 hari): ${acwrData?.chronicLoad || 0}
- Fitness (CTL): ${trainingMetrics?.fitness || 0}
- Fatigue (ATL): ${trainingMetrics?.fatigue || 0}
- Form (TSB): ${trainingMetrics?.form || 0}

**Data Readiness:**
${readinessInfo}

**Hasil Tes Biomotor Terbaru:**
${testInfo}

Berikan analisis komprehensif kondisi atlet saat ini dan rekomendasi untuk minggu ini.`;

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
        return new Response(JSON.stringify({ error: "Rate limit. Coba lagi nanti." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Analisis AI gagal" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
