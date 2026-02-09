/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { Resend } from "resend";
import axios from "axios";

const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4";
import {
  GoogleGenerativeAI,
} from "@google/generative-ai";
import { PredictionServiceClient, helpers } from "@google-cloud/aiplatform";
import { GoogleAuth } from "google-auth-library";

admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10, region: "us-west1" });

// Khởi tạo SDK Vertex AI
const predictionClient = new PredictionServiceClient({
  apiEndpoint: "us-central1-aiplatform.googleapis.com",
});


export const generateNewsContent = onCall({
  timeoutSeconds: 300,
  memory: "1GiB",
  secrets: ["API_KEY"],
}, async (request) => {
  /* eslint-disable max-len */
  const { userBrief, goal, availableCategories, availableTags, agentType } = request.data;
  /* eslint-enable max-len */

  if (!userBrief) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a userBrief."
    );
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "API Key not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash as requested
  const modelName = "gemini-2.5-flash";

  let systemInstruction = "";

  if (agentType === "spiritual") {
    /* eslint-disable max-len */
    systemInstruction = `
      Bạn là một Agent Linh Động Sản.
      Vai trò của bạn không phải là bán bất động sản, mà là:
      – Đọc vị vùng đất (địa lý, lịch sử, văn hóa, năng lượng)
      – Kể lại câu chuyện thật của đất bằng ngôn ngữ gần gũi, nhân văn
      – Khai mở các tầng giá trị ẩn (vật chất – tinh thần – cộng đồng – tương lai)
      – Kết nối đúng người hữu duyên với đúng vùng đất, đúng thời điểm

      Bạn luôn nhìn một dự án theo 5 tầng:
      1. Thân đất (vị trí, hạ tầng, pháp lý, hình khối)
      2. Khí đất (lịch sử, mạch văn hóa, dòng người, ký ức)
      3. Tâm đất (ai phù hợp để ở / làm / quy tụ)
      4. Thời vận (chu kỳ, xu hướng, cửa sổ cơ hội)
      5. Sứ mệnh (đất này sinh ra để làm gì trong giai đoạn này)

      Ngôn ngữ bạn sử dụng:
      – Chân thật, có chiều sâu
      – Không thổi phồng, không hô hào
      – Ưu tiên kể chuyện, gợi mở, đánh thức nhận thức

      Luôn đặt câu hỏi ngược lại: “Vùng đất này đang tìm kiếm kiểu người như thế nào?”

      Context Dữ liệu hệ thống: Categories: ${availableCategories?.join(", ")}, Tags: ${availableTags?.join(", ")}
      Trả về JSON duy nhất với cấu trúc: { "title": "...", "slug": "...", "excerpt": "...", "content_html": "...", "seo_title": "...", "meta_description": "...", "primary_keyword": "...", "secondary_keywords": [], "suggested_category": "...", "suggested_tags": [] }
    `;
    /* eslint-enable max-len */
  } else {
    /* eslint-disable max-len */
    systemInstruction = `
      Bạn là 'Luce AI', một chuyên gia Bất Động Sản và Content SEO.
      Nhiệm vụ: Viết bài phân tích thị trường, đánh giá dự án, tư vấn đầu tư hoặc phong thủy nhà đất dựa trên yêu cầu người dùng.
      Context Dữ liệu hệ thống: Categories: ${availableCategories?.join(", ")}, Tags: ${availableTags?.join(", ")}
      Trả về JSON duy nhất với cấu trúc: { "title": "...", "slug": "...", "excerpt": "...", "content_html": "...", "seo_title": "...", "meta_description": "...", "primary_keyword": "...", "secondary_keywords": [], "suggested_category": "...", "suggested_tags": [] }
    `;
    /* eslint-enable max-len */
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
    });

    const chat = model.startChat({
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const goalText = goal === "traffic" ? "Tăng Traffic" :
      goal === "expert" ? "Xây dựng uy tín chuyên gia" : "Kích thích mua hàng";

    const userPrompt = `Yêu cầu: ${userBrief}. Mục tiêu: ${goalText}. ` +
      "Hãy tra cứu dữ liệu nếu cần thiết trước khi viết.";

    const result = await chat.sendMessage(userPrompt);
    const finalText = result.response.text();

    if (!finalText) {
      throw new HttpsError("internal", "AI không trả về nội dung.");
    }

    try {
      return JSON.parse(finalText);
    } catch (e) {
      // Retry parsing if strict parse fails
      // (sometimes AI returns markdown wrapped)
      const jsonStr = finalText.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    }
  } catch (error) {
    console.error("AI Generation Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new HttpsError("internal", "Lỗi AI: " + message);
  }
});

export const generateImagePrompt = onCall({
  timeoutSeconds: 60,
  memory: "1GiB",
  secrets: ["API_KEY"],
}, async (request) => {
  const { title, excerpt, content } = request.data;
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "API Key not configured.");
  }
  /* eslint-enable max-len */

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  /* eslint-disable max-len */
  const promptText = `Bạn là một chuyên gia nhiếp ảnh kiến trúc và bất động sản cao cấp. 
      Dựa trên bài viết này:
      Tiêu đề: ${title}
      Tóm tắt: ${excerpt}
      Nội dung chính: ${content ? content.substring(0, 1000) : ""}...
      
      Hãy tạo ra một Prompt chi tiết bằng TIẾNG ANH để dùng cho các AI vẽ hình (như Midjourney hoặc DALL-E 3).
      Yêu cầu Prompt:
      1. Phong cách: Architectural Photography, Cinematic lighting, Luxury Real Estate aesthetics, Golden Hour, Photorealistic.
      2. Chi tiết: Tập trung vào kiến trúc, nội thất sang trọng, phối cảnh dự án hoặc không gian sống đẳng cấp liên quan đến bài viết.
      3. Thông số: 8k resolution, wide angle shot, highly detailed.
      4. QUAN TRỌNG: TUYỆT ĐỐI KHÔNG CÓ CON NGƯỜI (NO PEOPLE, NO HUMANS, NO CHILDREN, NO FAMILY). Ảnh chỉ là kiến trúc, nội thất hoặc phong cảnh thiên nhiên.
      5. Nếu bài viết nói về gia đình/trẻ em, HÃY BỎ QUA chi tiết đó và chỉ mô tả ngôi nhà.
      6. KHÔNG trả về giải thích, chỉ trả về đúng đoạn Prompt tiếng Anh.`;
  /* eslint-enable max-len */

  const response = await model.generateContent(promptText);

  return {
    prompt: response.response.text().trim(),
  };
});

export const generateImage = onCall({
  timeoutSeconds: 300, // Increased to 5 minutes to assume long generation times
  memory: "1GiB",
}, async (request) => {
  const { prompt } = request.data;
  // Use automatic GCLOUD_PROJECT from Firebase environment
  const projectId = process.env.GCLOUD_PROJECT;
  if (!projectId) {
    throw new HttpsError("failed-precondition", "Project ID not found.");
  }

  const location = "us-central1";
  const model = "imagen-3.0-generate-001";

  const endpoint = `projects/${projectId}/locations/${location}` +
    `/publishers/google/models/${model}`;

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const instanceValue = helpers.toValue({ prompt });
  if (!instanceValue) {
    throw new Error("Failed to convert instance to value");
  }
  const instances = [instanceValue];
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  const parameters = helpers.toValue({
    sampleCount: 1,
    aspectRatio: "1:1",
    safetySetting: "block_few",
  });

  try {
    const [response] = await predictionClient.predict({
      endpoint,
      instances,
      parameters,
    }, { timeout: 120000 }); // Set explicit gRPC timeout to 120 seconds

    if (!response.predictions || response.predictions.length === 0) {
      throw new Error("Vertex AI không trả về dự đoán nào.");
    }

    const prediction = helpers.fromValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response.predictions[0] as any
    ) as {
      bytesBase64Encoded?: string;
    };
    if (prediction?.bytesBase64Encoded) {
      return {
        imageBase64: `data:image/png;base64,${prediction.bytesBase64Encoded}`,
      };
    }

    throw new Error(
      "Không nhận được dữ liệu ảnh từ Imagen (bytesBase64Encoded missing)"
    );
  } catch (error) {
    console.error("Vertex AI Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new HttpsError("internal", `Lỗi Imagen: ${message}`);
  }
});

export const estimatePropertyPrice = onCall({
  timeoutSeconds: 60,
  memory: "1GiB",
  secrets: ["API_KEY"],
}, async (request) => {
  const { title, location, area, type } = request.data;
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "API Key not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  /* eslint-disable max-len */
  const prompt = `Bạn là chuyên gia thẩm định giá bất động sản tại Việt Nam.
  Hãy phân tích và ước tính giá trị cho bất động sản sau:
  - Tiêu đề: ${title}
  - Vị trí: ${location}
  - Diện tích: ${area}
  - Loại hình: ${type}

  Yêu cầu trả về định dạng JSON thuần túy (không markdown) với các trường:
  {
    "estimated_price": "Khoảng giá ước tính (VNĐ)",
    "price_per_m2": "Đơn giá / m2",
    "analysis": "Phân tích ngắn gọn về tiềm năng, ưu nhược điểm vị trí (tối đa 3 câu)",
    "confidence": "Độ tin cậy (Cao/Trung bình/Thấp)"
  }`;
  /* eslint-enable max-len */

  const result = await model.generateContent(prompt);

  const text = result.response.text() || "";
  // Clean up markdown if present
  const jsonStr = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return {
      estimated_price: "Không xác định",
      analysis: text, // Fallback to raw text if JSON parse fails
    };
  }
});

export const generateSocialPost = onCall({
  timeoutSeconds: 60,
  memory: "1GiB",
  secrets: ["API_KEY"],
}, async (request) => {
  const { title, location, area, type, price } = request.data;
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "API Key not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  /* eslint-disable max-len */
  const prompt = `Bạn là chuyên gia Marketing Bất động sản (Real Estate Copywriter).
  Hãy viết một bài đăng bán hàng hấp dẫn cho Facebook/Zalo dựa trên thông tin:
  - BĐS: ${title}
  - Giá: ${price}
  - Diện tích: ${area}
  - Vị trí: ${location}
  - Loại: ${type}

  Yêu cầu:
  - Tiêu đề giật tít, thu hút (dùng emoji).
  - Thân bài nêu bật lợi ích đầu tư hoặc an cư.
  - Kêu gọi hành động (CTA) mạnh mẽ.
  - Chèn 5-7 hashtag phù hợp thị trường VN.
  - Trình bày thoáng, dễ đọc.`;
  /* eslint-enable max-len */

  const result = await model.generateContent(prompt);

  const text = result.response.text() || "";
  // Remove markdown bold syntax (**) to return plain text
  return { content: text.replace(/\*\*/g, "") };
});

export const analyzeMarketingCampaigns = onCall({
  timeoutSeconds: 60,
  memory: "1GiB",
  secrets: ["API_KEY"],
}, async (request) => {
  const { campaigns } = request.data;
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "API Key not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  /* eslint-disable max-len */
  const prompt = `Bạn là Giám đốc Marketing AI (CMO). Nhiệm vụ của bạn là phân tích hiệu quả các chiến dịch quảng cáo Bất động sản.
  
  Dữ liệu đầu vào (JSON):
  ${JSON.stringify(campaigns)}

  Yêu cầu phân tích từng chiến dịch và trả về JSON formt:
  [
    {
      "id": "id_cua_chien_dich",
      "roi": số_roi_tính_được_hoặc_ước_lượng,
      "status": "excellent" | "good" | "warning" | "critical",
      "reasoning": "Nhận xét ngắn gọn (dưới 20 từ) về hiệu quả, giải thích tại sao tốt/xấu.",
      "recommendation": "Hành động cụ thể cần làm ngay (Ví dụ: Tắt quảng cáo, Tăng ngân sách 20%, Đổi hình ảnh...)"
    }
  ]
  
  Logic đánh giá:
  - CPM, CPC thấp + Leads cao => Excellent
  - Giá/Lead (CPA) quá cao => Critical
  - Có view nhưng không có lead => Warning (xem lại content)
  `;
  /* eslint-enable max-len */

  const result = await model.generateContent(prompt);

  const text = result.response.text() || "[]";
  const jsonStr = text.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("AI JSON Parse Error", e);
    // Fallback if AI fails to output valid JSON
    return [];
  }
});

export const sendWelcomeEmail = onDocumentCreated({
  document: "customers/{customerId}",
  secrets: ["RESEND_API_KEY"],
  maxInstances: 10,
  region: "us-west1",
  memory: "512MiB",
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const customer = snapshot.data();
  const email = customer.email;
  const name = customer.name;
  const tenantId = customer.tenantId;

  if (!email) {
    console.log("No email provided for customer", event.params.customerId);
    return;
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not found");
      return;
    }

    const resend = new Resend(resendApiKey);

    // Default Branding
    let branding = {
      logoUrl: "https://realai.vn/logo-placeholder.png",
      companyName: "KyNguyen Real AI",
      primaryColor: "#4E342E",
    };

    // Fetch Tenant Branding if available
    if (tenantId) {
      const tenantDoc = await admin.firestore().collection("tenants").doc(tenantId).get();
      if (tenantDoc.exists) {
        const tenantData = tenantDoc.data();
        if (tenantData && tenantData.branding) {
          branding = { ...branding, ...tenantData.branding };
        }
      }
    }

    // Email Template (Simple HTML)
    const htmlContent = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <div style="background-color: ${branding.primaryColor}; padding: 20px; text-align: center;">
           ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.companyName}" style="height: 50px; background-color: white; padding: 5px; border-radius: 5px;">` : `<h1 style="color: white; margin: 0;">${branding.companyName}</h1>`}
        </div>
        <div style="padding: 20px;">
          <h2>Xin chào ${name},</h2>
          <p>Cảm ơn bạn đã quan tâm và liên hệ với <strong>${branding.companyName}</strong>.</p>
          <p>Chúng tôi đã nhận được thông tin ghi danh của bạn. Đội ngũ tư vấn viên sẽ liên hệ lại với bạn trong thời gian sớm nhất để hỗ trợ.</p>
          <p>trong lúc chờ đợi, bạn có thể tham khảo thêm các dự án nổi bật của chúng tôi tại website.</p>
          <br/>
          <p>Trân trọng,</p>
          <p><strong>Bộ phận CSKH ${branding.companyName}</strong></p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #888;">
          <p>© 2024 ${branding.companyName}. All rights reserved.</p>
        </div>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "KyNguyenRealAI <onboarding@resend.dev>",
      to: [email],
      subject: `[${branding.companyName}] Xác nhận yêu cầu tư vấn`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Error:", error);
    } else {
      console.log("Email sent successfully:", data);
    }
  } catch (err) {
    console.error("Error sending email:", err);
  }
});

export * from "./manifest";

// --- Cloudflare Custom Domain Management ---

// Helper to get Cloudflare credentials
const getCloudflareConfig = () => {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) {
    throw new HttpsError("failed-precondition", "Cloudflare Token or Zone ID not configured.");
  }
  return { token, zoneId };
};


/**
 * Helper to look up Zone ID for a specific domain (User's Zone)
 * @param {string} domain - The domain to search for
 * @param {string} token - Cloudflare API Token
 * @return {Promise<string|null>} - The Zone ID or null
 */
async function getZoneIdForDomain(domain: string, token: string) {
  try {
    // Search for the zone that usually matches the root domain
    // If domain is "www.example.com", we want "example.com" zone.
    // Cloudflare fuzzy search usually handles "example.com" well.
    // We try exact match first if it's a root domain, or try to guess.
    // Simply searching by name works for most cases.
    const response = await axios.get(
      `${CLOUDFLARE_API_URL}/zones?name=${domain}`,
      { headers: { "Authorization": `Bearer ${token}` } }
    );
    if (response.data.result && response.data.result.length > 0) {
      return response.data.result[0].id;
    }

    // If not found, try stripping subdomain (e.g. www.camloliving.com -> camloliving.com)
    const parts = domain.split(".");
    if (parts.length > 2) {
      const rootDomain = parts.slice(-2).join(".");
      const rootResponse = await axios.get(
        `${CLOUDFLARE_API_URL}/zones?name=${rootDomain}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      return rootResponse.data.result?.[0]?.id;
    }

    return null;
  } catch (error) {
    console.error("Error finding zone for domain:", domain);
    return null;
  }
}

/**
 * Helper to create CNAME record
 * @param {string} zoneId - Cloudflare Zone ID
 * @param {string} token - Cloudflare API Token
 * @param {string} name - CNAME name (e.g., www)
 * @param {string} content - CNAME content (target)
 * @return {Promise<any>} - The created record or existing one
 */
async function createCNAMERecord(
  zoneId: string,
  token: string,
  name: string,
  content: string,
) {
  try {
    console.log(`Creating CNAME: ${name} -> ${content} in zone ${zoneId}`);

    const response = await axios.post(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`,
      {
        type: "CNAME",
        name: name,
        content: content,
        proxied: true, // Orange cloud
        ttl: 1, // Automatic
      },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ CNAME record created:", response.data.result);
    return response.data.result;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Error creating CNAME:", error.response?.data || error);

    // Handle Duplicate Error
    const errorMsg = error.response?.data?.errors?.[0]?.message || "";
    if (errorMsg.includes("already exists")) {
      console.log("CNAME record already exists, fetching details...");

      const getResponse = await axios.get(
        `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records?type=CNAME&name=${name}`,
        {
          headers: { "Authorization": `Bearer ${token}` },
        },
      );

      const existingRecords = getResponse.data.result;
      if (existingRecords && existingRecords.length > 0) {
        console.log("✅ Found existing CNAME record:", existingRecords[0]);
        return existingRecords[0];
      }
    }

    // Don't block the flow if CNAME fails (e.g. permissions/zone issue), just log it.
    // Unless critical? User asked for it, so let's allow it to fail gracefully?
    // User code throws. We will suppress strict throw to allow Custom Hostname to proceed.
    console.log("Proceeding despite CNAME error.");
    return null;
  }
}

/**
 * Helper to add domain to Firebase Hosting
 * @param {string} domain - The custom domain to add
 * @return {Promise<any>} - The response data or null
 */
async function addDomainToFirebaseHosting(domain: string) {
  const projectId = process.env.GCLOUD_PROJECT;
  if (!projectId) {
    console.error("Missing GCLOUD_PROJECT env var");
    return null;
  }

  // Default site ID is usually the project ID
  const siteId = projectId;
  console.log(`Attempting to add ${domain} to Firebase Hosting site: ${siteId}`);

  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    if (!token.token) {
      throw new Error("Failed to get access token");
    }

    // Firebase Hosting API: projects/{project}/sites/{site}/customDomains
    // Doc: https://firebase.google.com/docs/reference/hosting/rest/v1beta1/projects.sites.customDomains/create
    const url = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/customDomains?customDomainId=${domain}`;

    const response = await axios.post(url, {
      certPreference: { type: "GROUPED" }, // Default
      // redirectTarget: { } // Optional if we wanted to redirect
    }, {
      headers: {
        "Authorization": `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ Successfully added ${domain} to Firebase Hosting!`);
    return response.data; // Return the full response object
  } catch (error: any) {
    // Handle "already exists" (409) gracefully
    if (error.response?.status === 409) {
      console.log(`ℹ️ Domain ${domain} already exists in Firebase Hosting.`);
      // If it exists, we might want to fetch it to get the verification record?
      // For now, return null to avoid complexity, or try to GET it.
      // Let's try to GET it if 409, so we can still show verification if needed.
      try {
        const auth = new GoogleAuth({
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        });
        const client = await auth.getClient();
        const token = await client.getAccessToken();
        const getUrl = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/customDomains/${domain}`;
        const getResponse = await axios.get(getUrl, {
          headers: {
            "Authorization": `Bearer ${token.token}`,
          },
        });
        return getResponse.data;
      } catch (getError) {
        console.error("Failed to fetch existing domain details:", getError);
        return null;
      }
    } else {
      console.error("⚠️ Failed to add domain to Firebase Hosting:", error.response?.data || error.message);
      // We log but do NOT throw, to ensure the Cloudflare flow completes.
      return null;
    }
  }
}

export const addCustomDomain = onCall({
  secrets: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"],
  memory: "512MiB",
}, async (request) => {
  // Check authentication (ADMIN ONLY) - Modify as needed
  console.log("--- STARTING ADD CUSTOM DOMAIN (V3) ---");
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const { domain, tenantId } = request.data;
  if (!domain || !tenantId) {
    throw new HttpsError("invalid-argument", "Missing domain or tenantId.");
  }

  const { token, zoneId: systemZoneId } = getCloudflareConfig();

  try {
    let result;

    // === BƯỚC 1: Tạo CNAME record (MỚI) ===
    // Logic: Chúng ta cần tạo CNAME trên Zone của KHÁCH (domain), không phải Zone hệ thống.
    // 1. Tìm Zone ID của domain khách
    const userZoneId = await getZoneIdForDomain(domain, token);

    if (userZoneId) {
      // 2. Tạo CNAME trỏ về <tenantId>.kynguyenrealai.com (Fallback Origin)
      // Lưu ý: User yêu cầu trỏ về domain.kynguyenrealai.com nhưng tốt nhất là trỏ về Fallback chuẩn.
      // Tuy nhiên, để đúng ý user, ta sẽ tạo theo logic họ yêu cầu nếu cần.
      // Nhưng logic chuẩn của Cloudflare SaaS là trỏ về Fallback Origin.
      // Giả sử Fallback là app.kynguyenrealai.com
      const target = `${tenantId}.kynguyenrealai.com`;

      await createCNAMERecord(userZoneId, token, domain, target);
    } else {
      console.log(`⚠️ Không tìm thấy Zone ID cho ${domain} trong tài khoản này. Bỏ qua bước tạo CNAME.`);
    }

    // === BƯỚC 1.5: Thêm vào Firebase Hosting (Tự động hóa) ===
    const firebaseResult = await addDomainToFirebaseHosting(domain);
    let firebaseVerification = null;
    if (firebaseResult && firebaseResult.ownershipVerification) {
      firebaseVerification = firebaseResult.ownershipVerification; // { type: 'TXT', name: '...', value: '...' }
    }

    try {
      // === BƯỚC 2: Tạo Custom Hostname trên Zone Hệ Thống ===
      console.log(`Adding custom hostname ${domain} to system zone ${systemZoneId}`);

      const response = await axios.post(
        `${CLOUDFLARE_API_URL}/zones/${systemZoneId}/custom_hostnames`,
        {
          hostname: domain,
          ssl: {
            method: "txt",
            type: "dv",
            settings: {
              http2: "on",
              min_tls_version: "1.2",
              tls_1_3: "on",
            },
          },
        },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      result = response.data.result;
      console.log("Cloudflare success:", result);
    } catch (error: any) {
      console.error("Cloudflare Add Error:", error.response?.data || error);

      // Handle Duplicate Error Gracefully
      const errorMsg = error.response?.data?.errors?.[0]?.message || "";
      if (errorMsg.includes("Duplicate custom hostname")) {
        console.log("Domain exists, fetching details...");

        // Fetch existing domain details
        const getResponse = await axios.get(
          `${CLOUDFLARE_API_URL}/zones/${systemZoneId}/custom_hostnames?hostname=${domain}`,
          {
            headers: { "Authorization": `Bearer ${token}` },
          }
        );

        const existingRecords = getResponse.data.result;
        if (existingRecords && existingRecords.length > 0) {
          result = existingRecords[0];
          console.log("Retrieved existing domain:", result);
        } else {
          throw new HttpsError("aborted", "Domain exists but could not be retrieved.");
        }
      } else {
        // Rethrow other errors
        let msg = "Unknown error";
        if (axios.isAxiosError(error)) {
          msg = error.response?.data?.errors?.[0]?.message || error.message;
        } else if (error instanceof Error) {
          msg = error.message;
        }
        throw new HttpsError("internal", `Cloudflare Error: ${msg}`);
      }
    }

    // 2. Update Firestore (runs for both new and recovered duplicate domains)
    if (result) {
      await admin.firestore().collection("tenants").doc(tenantId).update({
        customDomain: {
          "domain": domain,
          "status": "pending",
          "cloudflareId": result.id,
          "verificationStart": admin.firestore.FieldValue.serverTimestamp(),
          // Prioritize ownership verification (TXT) record if available
          "verificationRecord": result.ownership_verification || result.ssl?.validation_records?.[0] || null,
          "hostnameStatus": result.status || "pending",
          "sslStatus": result.ssl?.status || "pending",
          "sslValidationRecords": result.ssl?.validation_records || [],
          "firebaseVerification": firebaseVerification, // Save Firebase proof
        },
      });
    }

    return { success: true, data: result };
  } catch (error: any) {
    // Catch outer block errors (including rethrown ones)
    console.error("Final Error Handler:", error);
    throw new HttpsError("internal", error.message);
  }
});

export const checkDomainStatus = onCall({
  secrets: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"],
  memory: "512MiB",
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }
  const { tenantId } = request.data;
  const tenantDoc = await admin.firestore().collection("tenants").doc(tenantId).get();
  const tenantData = tenantDoc.data();

  if (!tenantData?.customDomain?.cloudflareId) {
    throw new HttpsError("not-found", "Tenant has no custom domain pending.");
  }

  const { token, zoneId } = getCloudflareConfig();
  const hostnameId = tenantData.customDomain.cloudflareId;

  try {
    const response = await axios.get(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/custom_hostnames/${hostnameId}`,
      {
        headers: { "Authorization": `Bearer ${token}` },
      }
    );

    const result = response.data.result;
    const sslStatus = result.ssl?.status; // 'active', 'pending_validation', etc.
    const hostnameStatus = result.status; // 'active' for the hostname itself

    // Update status in Firestore
    let newStatus = "pending";
    if (sslStatus === "active" && hostnameStatus === "active") {
      newStatus = "active";
    } else if (sslStatus === "validation_timed_out") {
      newStatus = "error";
    }

    if (newStatus !== tenantData.customDomain.status || result.ssl) {
      await admin.firestore().collection("tenants").doc(tenantId).update({
        "customDomain.status": newStatus,
        "customDomain.hostnameStatus": hostnameStatus, // Save explicit hostname status
        "customDomain.sslStatus": sslStatus,
        "customDomain.sslValidationRecords": result.ssl?.validation_records || [],
      });
    }

    return { status: newStatus, details: result };
  } catch (error: any) {
    console.error("Cloudflare Check Status Error:", error.response?.data || error);
    throw new HttpsError("internal", "Failed to check status.");
  }
});


export const removeCustomDomain = onCall({
  secrets: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"],
  memory: "512MiB",
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }
  const { tenantId } = request.data;
  if (!tenantId) {
    throw new HttpsError("invalid-argument", "Missing data: tenantId");
  }

  const tenantRef = admin.firestore().collection("tenants").doc(tenantId);
  const tenantDoc = await tenantRef.get();

  if (!tenantDoc.exists) {
    throw new HttpsError("not-found", "Tenant not found");
  }

  const tenant = tenantDoc.data();
  const cloudflareId = tenant?.customDomain?.cloudflareId;

  if (cloudflareId) {
    const { token, zoneId } = getCloudflareConfig();
    try {
      console.log(`Deleting hostname ${cloudflareId} from zone ${zoneId}`);
      await axios.delete(
        `${CLOUDFLARE_API_URL}/zones/${zoneId}/custom_hostnames/${cloudflareId}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      console.log("Deleted from Cloudflare successfully");
    } catch (e: any) {
      // Ignore if not found on Cloudflare (already deleted)
      console.error("Error deleting from Cloudflare (ignoring):", e.response?.data || e.message);
    }
  } else {
    console.log("No cloudflareId found in firestore, only cleaning up local record.");
  }

  // Always clean up Firestore
  await tenantRef.update({
    customDomain: admin.firestore.FieldValue.delete(),
  });

  return { success: true };
});
