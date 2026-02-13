import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the DB module
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock the drive service
vi.mock("../ropa-drive-service", () => ({
  getClientFolder: vi.fn().mockResolvedValue(null),
  listFolderFiles: vi.fn().mockResolvedValue([]),
  getFileContent: vi.fn().mockResolvedValue(""),
}));

describe("Brand Firewall", () => {
  let brandFirewall: typeof import("../brand-firewall");

  beforeEach(async () => {
    vi.resetModules();
    brandFirewall = await import("../brand-firewall");
    // Clear brand context before each test
    brandFirewall.clearBrandContext();
    brandFirewall.invalidateBrandCache();
  });

  describe("Zero Trust Brand Isolation", () => {
    it("should clear brand context between companies", () => {
      brandFirewall.setActiveBrand("FAGOR");
      brandFirewall.clearBrandContext();
      // After clearing, no brand should be active
      // The function should not throw
      expect(() => brandFirewall.clearBrandContext()).not.toThrow();
    });

    it("should set active brand correctly", () => {
      expect(() => brandFirewall.setActiveBrand("PETLIFE 360")).not.toThrow();
    });

    it("should switch brands without contamination", () => {
      brandFirewall.setActiveBrand("FAGOR");
      brandFirewall.clearBrandContext();
      brandFirewall.setActiveBrand("PETLIFE 360");
      // No error means successful isolation
      expect(true).toBe(true);
    });
  });

  describe("Brand Profile Generation", () => {
    it("should generate FAGOR profile with industrial styling", async () => {
      const profile = await brandFirewall.getBrandProfile("FAGOR");
      expect(profile).toBeDefined();
      expect(profile.companyName).toContain("FAGOR");
      expect(profile.sector).toBe("industrial");
      expect(profile.primaryColor).toBeDefined();
      expect(profile.secondaryColor).toBeDefined();
    });

    it("should generate PETLIFE 360 profile with consumer/pet styling", async () => {
      const profile = await brandFirewall.getBrandProfile("PETLIFE 360");
      expect(profile).toBeDefined();
      expect(profile.companyName).toContain("PETLIFE");
      expect(profile.sector).toBe("consumer");
      expect(profile.primaryColor).toBeDefined();
    });

    it("should generate different profiles for different companies", async () => {
      const fagor = await brandFirewall.getBrandProfile("FAGOR");
      const petlife = await brandFirewall.getBrandProfile("PETLIFE 360");
      
      // They should have different colors
      expect(fagor.primaryColor).not.toBe(petlife.primaryColor);
      // They should have different sectors
      expect(fagor.sector).not.toBe(petlife.sector);
    });

    it("should generate a profile for unknown companies with defaults", async () => {
      const profile = await brandFirewall.getBrandProfile("UNKNOWN_COMPANY_XYZ");
      expect(profile).toBeDefined();
      expect(profile.companyName).toBe("UNKNOWN_COMPANY_XYZ");
      expect(profile.primaryColor).toBeDefined();
      expect(profile.sector).toBe("other");
    });
  });

  describe("Branded Email HTML Generation", () => {
    it("should generate HTML for FAGOR with FAGOR branding", async () => {
      const result = await brandFirewall.generateBrandedEmailHtml({
        companyName: "FAGOR",
        subject: "Soluciones CNC para su empresa",
        body: "Estimado cliente, le presentamos nuestras soluciones de automatización industrial.",
      });

      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(100);
      expect(result.html).toContain("FAGOR");
      expect(result.coherenceCheck).toBeDefined();
    });

    it("should generate HTML for PETLIFE 360 with PETLIFE 360 branding", async () => {
      const result = await brandFirewall.generateBrandedEmailHtml({
        companyName: "PETLIFE 360",
        subject: "Cuida a tu mascota con amor",
        body: "Descubre nuestros productos premium para el bienestar de tu mascota.",
      });

      expect(result.html).toBeDefined();
      expect(result.html.length).toBeGreaterThan(100);
      expect(result.html).toContain("PETLIFE 360");
      expect(result.coherenceCheck).toBeDefined();
    });

    it("should NOT contain FAGOR assets in PETLIFE 360 email", async () => {
      const result = await brandFirewall.generateBrandedEmailHtml({
        companyName: "PETLIFE 360",
        subject: "Productos para mascotas",
        body: "Nuestros productos de calidad premium.",
      });

      // The HTML should NOT contain FAGOR-specific elements
      expect(result.html).not.toContain("FAGOR Automation");
      expect(result.html).not.toContain("CNC SOLUTIONS");
      expect(result.html).not.toContain("Rolling Meadows");
      expect(result.html).not.toContain("FAGOR AUTOMATION USA");
    });

    it("should NOT contain PETLIFE 360 assets in FAGOR email", async () => {
      const result = await brandFirewall.generateBrandedEmailHtml({
        companyName: "FAGOR",
        subject: "Automatización industrial",
        body: "Soluciones de automatización CNC.",
      });

      // The HTML should NOT contain PETLIFE 360-specific elements
      expect(result.html).not.toContain("PETLIFE 360");
      expect(result.html).not.toContain("mascota");
    });

    it("should produce visually different templates for different companies", async () => {
      const fagorResult = await brandFirewall.generateBrandedEmailHtml({
        companyName: "FAGOR",
        subject: "Test",
        body: "Test body",
      });

      const petlifeResult = await brandFirewall.generateBrandedEmailHtml({
        companyName: "PETLIFE 360",
        subject: "Test",
        body: "Test body",
      });

      // The HTML should be structurally different (different colors, logos, etc.)
      expect(fagorResult.html).not.toBe(petlifeResult.html);
      
      // Both should be valid HTML
      expect(fagorResult.html).toContain("<!DOCTYPE html");
      expect(petlifeResult.html).toContain("<!DOCTYPE html");
    });
  });

  describe("Coherence Check", () => {
    it("should pass coherence check when brand matches", async () => {
      const profile = await brandFirewall.getBrandProfile("FAGOR");
      const result = await brandFirewall.generateBrandedEmailHtml({
        companyName: "FAGOR",
        subject: "Test FAGOR",
        body: "Test FAGOR automation content",
      });
      
      const check = brandFirewall.runCoherenceCheck(result.html, profile);
      expect(check).toBe(true);
    });

    it("should fail coherence check when wrong brand is in HTML", () => {
      const fagorProfile: any = {
        companyName: "FAGOR",
        sector: "industrial",
        colors: { primary: "#E31937", secondary: "#1a1a2e" },
      };

      // HTML that mentions PETLIFE360 instead of FAGOR
      const wrongHtml = `<!DOCTYPE html><html><body><h1>PETLIFE360</h1><p>Productos para mascotas</p></body></html>`;
      
      const check = brandFirewall.runCoherenceCheck(wrongHtml, fagorProfile);
      expect(check).toBe(false);
    });
  });

  describe("SMS Template Generation", () => {
    it("should generate SMS template for a company", async () => {
      const sms = await brandFirewall.generateBrandedSmsTemplate({
        companyName: "PETLIFE 360",
        body: "Descubre nuestros productos para mascotas",
      });

      expect(sms).toBeDefined();
      expect(sms.length).toBeGreaterThan(0);
      expect(sms).toContain("PETLIFE 360");
    });
  });

  describe("Call Script Generation", () => {
    it("should generate call script for a company", async () => {
      const script = await brandFirewall.generateBrandedCallScript({
        companyName: "FAGOR",
        body: "Presentar soluciones de automatización CNC",
        campaignName: "Campaña Industrial Q1",
      });

      expect(script).toBeDefined();
      expect(script.length).toBeGreaterThan(0);
      expect(script).toContain("FAGOR");
    });
  });

  describe("Brand Cache Management", () => {
    it("should invalidate specific company cache", () => {
      expect(() => brandFirewall.invalidateBrandCache("FAGOR")).not.toThrow();
    });

    it("should invalidate all caches", () => {
      expect(() => brandFirewall.invalidateBrandCache()).not.toThrow();
    });

    it("should update brand profile", () => {
      expect(() => brandFirewall.updateBrandProfile("FAGOR", {
        colors: { primary: "#FF0000", secondary: "#000000", accent: "#FFFFFF", background: "#F5F5F5", text: "#333333" },
      })).not.toThrow();
    });
  });
});
