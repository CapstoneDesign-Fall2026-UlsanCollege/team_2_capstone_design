import { describe, expect, it, vi, beforeEach } from "vitest";
import { uploadThemeMedia } from "./api";

describe("uploadThemeMedia", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts multipart/form-data to the store theme media upload endpoint", async () => {
    const mockResponse = {
      success: true,
      url: "https://res.cloudinary.com/test-cloud/image/upload/f_auto,q_auto/v1/shopcraft/stores/1_my-store/theme/store_1_hero_123.jpg",
      filename: "store_1_hero_123.jpg",
      public_id: "shopcraft/stores/1_my-store/theme/store_1_hero_123",
    };

    let capturedUrl = "";
    let capturedBody: FormData | null = null;
    let capturedMethod = "";

    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedMethod = init?.method || "";
      capturedBody = init?.body as FormData;

      return {
        ok: true,
        status: 201,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => mockResponse,
      };
    });

    const file = new File(["dummy content"], "cover.png", { type: "image/png" });
    const result = await uploadThemeMedia("my-store", file, "hero");

    expect(capturedUrl).toContain("/api/merchant/stores/my-store/media/theme/upload/");
    expect(capturedMethod).toBe("POST");
    expect(capturedBody).toBeInstanceOf(FormData);
    const formData = capturedBody as unknown as FormData;
    expect(formData.get("asset_type")).toBe("hero");
    expect(formData.get("file")).toBe(file);

    expect(result.success).toBe(true);
    expect(result.url).toBe(mockResponse.url);
    expect(result.public_id).toBe(mockResponse.public_id);
  });

  it("escapes store slug with special characters safely in URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true, url: "", filename: "", public_id: "" }),
    });

    const file = new File(["logo"], "logo.png", { type: "image/png" });
    await uploadThemeMedia("store with spaces", file, "logo");

    const uploadCall = vi.mocked(global.fetch).mock.calls.find((call) =>
      String(call[0]).includes("/media/theme/upload/")
    );
    expect(uploadCall).toBeDefined();
    expect(uploadCall?.[0]).toContain("/api/merchant/stores/store%20with%20spaces/media/theme/upload/");
  });
});
