import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Admin is initialized in index.ts

export const serveManifest = onRequest({
  timeoutSeconds: 60,
  memory: "512MiB",
  region: "us-west1", // Match other functions
}, async (req, res) => {
  const host = req.headers["host"] || "";
  // Basic domain stripping (remove www., port)
  const domain = host.split(":")[0].replace(/^www\./, "");

  // Default Manifest
  const defaultManifest = {
    name: "KynguyenRealAI",
    short_name: "KNRealAI - BDS",
    description: "Hệ thống quản lý và giao dịch bất động sản",
    theme_color: "#4E342E",
    background_color: "#F8FBFB",
    display: "standalone",
    start_url: "/",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };

  try {
    // Query Tenant by custom domain or subdomain
    let tenantData = null;

    // 1. Try to find by Main Domain
    const qDomain = await admin.firestore().collection("tenants")
      .where("customDomain", "==", domain)
      .limit(1)
      .get();

    if (!qDomain.empty) {
      tenantData = qDomain.docs[0].data();
    } else {
      // 2. Try to find by Subdomain (e.g. tenant.kynguyenrealai.com)
      if (domain.includes("kynguyenrealai.com")) {
        const subdomain = domain.split(".")[0];
        const qSub = await admin.firestore().collection("tenants")
          .where("subdomain", "==", subdomain)
          .limit(1)
          .get();
        if (!qSub.empty) {
          tenantData = qSub.docs[0].data();
        }
      }
    }

    if (tenantData && tenantData.branding) {
      const branding = tenantData.branding;
      const manifest = {
        ...defaultManifest,
        name: branding.companyName || defaultManifest.name,
        short_name: branding.companyName ? branding.companyName.substring(0, 12) : defaultManifest.short_name,
        theme_color: branding.primaryColor || defaultManifest.theme_color,
      };
      res.setHeader("Content-Type", "application/manifest+json");
      res.status(200).send(manifest);
      return;
    }

    // Return Default if no tenant found
    res.setHeader("Content-Type", "application/manifest+json");
    res.status(200).send(defaultManifest);
  } catch (error) {
    console.error("Error serving manifest:", error);
    res.setHeader("Content-Type", "application/manifest+json");
    res.status(500).send(defaultManifest);
  }
});
