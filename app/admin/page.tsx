"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface AdminProjectImage {
  id: number;
  url: string;
  alt: string;
}

interface AdminProject {
  id: number;
  slug: string;
  num: string;
  name: { fa: string; en: string };
  desc: { fa: string; en: string };
  url: string;
  media: string[];
  mediaItems?: AdminProjectImage[];
  stack: string[];
}

interface ProjectForm {
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  url: string;
  stack: string;
}

type UploadMode = "replace" | "append";

const EMPTY_FORM: ProjectForm = {
  titleFa: "",
  titleEn: "",
  descriptionFa: "",
  descriptionEn: "",
  url: "",
  stack: "",
};

const TOKEN_KEY = "portfolio-admin-token";

function getPayloadMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const record = payload as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.error === "string") return record.error;
  return undefined;
}

async function readApiResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  let payload: unknown = {};
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { detail: text };
    }
  }
  if (!response.ok) {
    throw new Error(getPayloadMessage(payload) || "درخواست انجام نشد.");
  }
  return payload;
}

function getImages(project: AdminProject): AdminProjectImage[] {
  if (project.mediaItems?.length) return project.mediaItems;
  return project.media.map((url) => ({ id: 0, url, alt: project.name.fa }));
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingImages, setEditingImages] = useState<AdminProjectImage[]>([]);
  const [uploadMode, setUploadMode] = useState<UploadMode>("replace");
  const [imageOrderDirty, setImageOrderDirty] = useState(false);
  const [projectOrderDirty, setProjectOrderDirty] = useState(false);
  const [imageViewer, setImageViewer] = useState<AdminProjectImage | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProjects = async (adminToken: string): Promise<boolean> => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/projects", {
        headers: { "x-admin-token": adminToken },
        cache: "no-store",
      });
      const payload = await readApiResponse(response);
      if (!Array.isArray(payload)) throw new Error("پاسخ پروژه‌ها معتبر نیست.");
      setProjects(payload as AdminProject[]);
      setToken(adminToken);
      setTokenInput(adminToken);
      setProjectOrderDirty(false);
      sessionStorage.setItem(TOKEN_KEY, adminToken);
      return true;
    } catch (reason) {
      setToken("");
      setProjects([]);
      setError(reason instanceof Error ? reason.message : "اتصال به پنل برقرار نشد.");
      sessionStorage.removeItem(TOKEN_KEY);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) void loadProjects(saved);
  }, []);

  useEffect(() => {
    if (!imageViewer) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImageViewer(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [imageViewer]);

  const handleTokenSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (tokenInput.trim()) void loadProjects(tokenInput.trim());
  };

  const handleFormChange = (field: keyof ProjectForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setFiles([]);
    setEditingId(null);
    setEditingImages([]);
    setUploadMode("replace");
    setImageOrderDirty(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (project: AdminProject) => {
    if (projectOrderDirty) {
      setError("ترتیب پروژه‌ها تغییر کرده است؛ ابتدا روی «ذخیره ترتیب پروژه‌ها» بزنید.");
      return;
    }
    setEditingId(project.id);
    setForm({
      titleFa: project.name.fa,
      titleEn: project.name.en,
      descriptionFa: project.desc.fa,
      descriptionEn: project.desc.en,
      url: project.url,
      stack: project.stack.join(", "),
    });
    setEditingImages(getImages(project));
    setUploadMode("replace");
    setImageOrderDirty(false);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMessage("");
    setError("");
    document.getElementById("project-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (!token) {
      setError("ابتدا توکن مدیریت را وارد کنید.");
      return;
    }
    if (projectOrderDirty) {
      setError("ترتیب پروژه‌ها تغییر کرده است؛ ابتدا روی «ذخیره ترتیب پروژه‌ها» بزنید.");
      return;
    }
    if (editingId !== null && imageOrderDirty) {
      setError("ترتیب تصاویر تغییر کرده است؛ ابتدا روی «ذخیره ترتیب تصاویر» بزنید.");
      return;
    }
    setIsLoading(true);
    try {
      const body = new FormData();
      body.append("title_fa", form.titleFa.trim());
      body.append("title_en", form.titleEn.trim());
      body.append("description_fa", form.descriptionFa.trim());
      body.append("description_en", form.descriptionEn.trim());
      body.append("project_url", form.url.trim());
      body.append("stack", form.stack);
      if (editingId !== null) {
        body.append("replace_images", String(files.length > 0 && uploadMode === "replace"));
      }
      files.forEach((file) => body.append("images", file));

      const response = await fetch(
        editingId === null ? "/api/admin/projects" : `/api/admin/projects/${editingId}`,
        {
          method: editingId === null ? "POST" : "PUT",
          headers: { "x-admin-token": token },
          body,
        },
      );
      await readApiResponse(response);
      if (!await loadProjects(token)) throw new Error("ذخیره شد، اما فهرست جدید دریافت نشد.");
      setMessage(editingId === null ? "پروژه با موفقیت اضافه شد." : "تغییرات پروژه با موفقیت ذخیره شد.");
      resetForm();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ذخیره‌ی پروژه انجام نشد.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (projectId: number) => {
    if (!token) return;
    if (projectOrderDirty) {
      setError("ترتیب پروژه‌ها تغییر کرده است؛ ابتدا روی «ذخیره ترتیب پروژه‌ها» بزنید.");
      return;
    }
    if (!window.confirm("این پروژه حذف شود؟")) return;
    setMessage("");
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      const payload = await readApiResponse(response);
      if (!payload || typeof payload !== "object" || !(payload as Record<string, unknown>).deleted) {
        throw new Error("حذف پروژه انجام نشد.");
      }
      if (!await loadProjects(token)) throw new Error("پروژه حذف شد، اما فهرست جدید دریافت نشد.");
      if (editingId === projectId) resetForm();
      setMessage("پروژه حذف شد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "حذف پروژه انجام نشد.");
    } finally {
      setIsLoading(false);
    }
  };

  const moveProject = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= projects.length) return;
    setProjects((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setProjectOrderDirty(true);
    setMessage("");
  };

  const saveProjectOrder = async () => {
    if (!token || !projectOrderDirty) return;
    setIsLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/projects/reorder", {
        method: "PATCH",
        headers: { "x-admin-token": token, "content-type": "application/json" },
        body: JSON.stringify({ project_ids: projects.map((project) => project.id) }),
      });
      const payload = await readApiResponse(response);
      if (!Array.isArray(payload)) throw new Error("ترتیب جدید معتبر نیست.");
      setProjects(payload as AdminProject[]);
      setProjectOrderDirty(false);
      setMessage("ترتیب پروژه‌ها ذخیره شد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ذخیره ترتیب پروژه‌ها انجام نشد.");
      await loadProjects(token);
    } finally {
      setIsLoading(false);
    }
  };

  const moveImage = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= editingImages.length) return;
    setEditingImages((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setImageOrderDirty(true);
    setMessage("");
  };

  const moveFile = (index: number, offset: -1 | 1) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= files.length) return;
    setFiles((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const saveImageOrder = async () => {
    if (!token || editingId === null || !imageOrderDirty) return;
    if (editingImages.some((image) => image.id <= 0)) {
      setError("شناسه تصاویر دریافت نشده است؛ یک بار از پنل خارج و دوباره وارد شوید.");
      return;
    }
    setIsLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/projects/${editingId}`, {
        method: "PATCH",
        headers: { "x-admin-token": token, "content-type": "application/json" },
        body: JSON.stringify({ image_ids: editingImages.map((image) => image.id) }),
      });
      await readApiResponse(response);
      if (!await loadProjects(token)) throw new Error("ترتیب ذخیره شد، اما فهرست جدید دریافت نشد.");
      setImageOrderDirty(false);
      setMessage("ترتیب تصاویر ذخیره شد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ذخیره ترتیب تصاویر انجام نشد.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (image: AdminProjectImage) => {
    if (!token || editingId === null || image.id <= 0) return;
    if (imageOrderDirty) {
      setError("ابتدا ترتیب تصاویر را ذخیره کنید.");
      return;
    }
    if (!window.confirm("این تصویر از گالری حذف شود؟")) return;
    setIsLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/admin/projects/${editingId}/images/${image.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      const payload = await readApiResponse(response);
      if (!payload || typeof payload !== "object" || !(payload as Record<string, unknown>).deleted) {
        throw new Error("حذف تصویر انجام نشد.");
      }
      setEditingImages((current) => current.filter((item) => item.id !== image.id));
      setImageViewer(null);
      if (!await loadProjects(token)) throw new Error("تصویر حذف شد، اما فهرست جدید دریافت نشد.");
      setMessage("تصویر حذف شد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "حذف تصویر انجام نشد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="admin-shell" dir="rtl">
      <div className="admin-shell__topbar">
        <div>
          <p className="admin-eyebrow">PORTFOLIO CMS</p>
          <h1>مدیریت پروژه‌ها</h1>
          <p>پروژه‌ها، لینک و گالری تصاویرشان را از اینجا مدیریت کنید.</p>
        </div>
        <Link href="/" className="frost-btn">بازگشت به سایت</Link>
      </div>

      {!token && (
        <section className="admin-panel admin-auth-panel">
          <p className="admin-eyebrow">ورود مدیر</p>
          <h2>توکن مدیریت را وارد کنید</h2>
          <form onSubmit={handleTokenSubmit} className="admin-token-form">
            <input
              type="password"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder="ADMIN_TOKEN"
              autoComplete="current-password"
            />
            <button type="submit" className="frost-btn frost-btn--primary" disabled={isLoading}>ورود</button>
          </form>
        </section>
      )}

      {token && (
        <div className="admin-grid">
          <section className="admin-panel">
            <p className="admin-eyebrow">{editingId === null ? "پروژه‌ی جدید" : "ویرایش پروژه"}</p>
            <h2>{editingId === null ? "افزودن نمونه‌کار" : "ویرایش نمونه‌کار"}</h2>
            <form id="project-form" onSubmit={handleSave} className="admin-form">
              <label>عنوان فارسی<input required value={form.titleFa} onChange={(event) => handleFormChange("titleFa", event.target.value)} /></label>
              <label>عنوان انگلیسی<input value={form.titleEn} onChange={(event) => handleFormChange("titleEn", event.target.value)} /></label>
              <label>توضیح فارسی<textarea rows={3} value={form.descriptionFa} onChange={(event) => handleFormChange("descriptionFa", event.target.value)} /></label>
              <label>توضیح انگلیسی<textarea rows={3} value={form.descriptionEn} onChange={(event) => handleFormChange("descriptionEn", event.target.value)} /></label>
              <label>لینک پروژه<input required type="url" placeholder="https://example.com" value={form.url} onChange={(event) => handleFormChange("url", event.target.value)} /></label>
              <label>تکنولوژی‌ها <span>(با ویرگول جدا کنید)</span><input placeholder="React, Next.js, PostgreSQL" value={form.stack} onChange={(event) => handleFormChange("stack", event.target.value)} /></label>

              {editingId !== null && (
                <fieldset className="admin-upload-mode">
                  <legend>نحوه‌ی اضافه‌کردن تصاویر جدید</legend>
                  <label><input type="radio" name="upload-mode" checked={uploadMode === "replace"} onChange={() => setUploadMode("replace")} /> جایگزینی کامل گالری</label>
                  <label><input type="radio" name="upload-mode" checked={uploadMode === "append"} onChange={() => setUploadMode("append")} /> افزودن به انتهای گالری</label>
                </fieldset>
              )}

              <label>تصاویر جدید <span>{editingId === null ? "حداکثر ۸ مگابایت برای هر تصویر" : uploadMode === "replace" ? "با انتخاب تصویر، گالری فعلی جایگزین می‌شود" : "تصاویر به انتهای گالری فعلی اضافه می‌شوند"}<input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} /></span></label>
              {files.length > 0 && (
                <div className="admin-upload-list">
                  <p className="admin-file-count">{files.length} تصویر انتخاب شده؛ ترتیب آن‌ها از بالا به پایین است.</p>
                  {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="admin-upload-item">
                      <span>{index + 1}. {file.name}</span>
                      <div>
                        <button type="button" onClick={() => moveFile(index, -1)} disabled={index === 0}>↑</button>
                        <button type="button" onClick={() => moveFile(index, 1)} disabled={index === files.length - 1}>↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {editingId !== null && (
                <div className="admin-gallery-editor">
                  <div className="admin-gallery-heading">
                    <div><p className="admin-eyebrow">گالری فعلی</p><h3>{editingImages.length} تصویر</h3></div>
                    <span>برای دیدن بزرگ‌تر روی تصویر بزنید.</span>
                  </div>
                  {editingImages.length > 0 ? (
                    <div className="admin-image-grid">
                      {editingImages.map((image, index) => (
                        <article key={`${image.id}-${image.url}`} className="admin-image-item">
                          <button type="button" className="admin-image-button" onClick={() => setImageViewer(image)} aria-label={`نمایش تصویر ${index + 1}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image.url} alt={image.alt || `تصویر ${index + 1}`} />
                          </button>
                          <div className="admin-image-item__footer">
                            <span>تصویر {index + 1}</span>
                            <div className="admin-image-actions">
                              <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0 || isLoading}>↑</button>
                              <button type="button" onClick={() => moveImage(index, 1)} disabled={index === editingImages.length - 1 || isLoading}>↓</button>
                              <button type="button" className="admin-delete" onClick={() => void deleteImage(image)} disabled={isLoading || image.id <= 0}>حذف</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : <p className="admin-empty">برای این پروژه تصویری ثبت نشده است.</p>}
                  {imageOrderDirty && <button type="button" className="frost-btn frost-btn--primary" onClick={() => void saveImageOrder()} disabled={isLoading}>ذخیره ترتیب تصاویر</button>}
                </div>
              )}

              <div className="admin-form-actions">
                <button type="submit" className="frost-btn frost-btn--primary" disabled={isLoading}>{isLoading ? "در حال ذخیره…" : editingId === null ? "افزودن پروژه" : "ذخیره‌ی تغییرات"}</button>
                {editingId !== null && <button type="button" className="frost-btn" onClick={resetForm} disabled={isLoading}>انصراف</button>}
              </div>
            </form>
          </section>

          <section className="admin-panel">
            <div className="admin-list-heading"><div><p className="admin-eyebrow">محتوای فعلی</p><h2>پروژه‌ها</h2></div><span>{projects.length} مورد</span></div>
            <div className="admin-order-toolbar">
              <p>با فلش‌ها ترتیب نمایش پروژه‌ها را عوض کنید.</p>
              <button type="button" className="frost-btn frost-btn--primary" onClick={() => void saveProjectOrder()} disabled={!projectOrderDirty || isLoading}>ذخیره ترتیب پروژه‌ها</button>
            </div>
            <div className="admin-project-list">
              {projects.map((project, index) => {
                const thumbnail = project.mediaItems?.[0]?.url || project.media[0];
                const imageCount = project.mediaItems?.length ?? project.media.length;
                return (
                  <article key={project.id} className="admin-project-item">
                    {thumbnail ? (
                      // MinIO may live on a separate host, so this thumbnail uses the remote object URL directly.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbnail} alt="" />
                    ) : <div className="admin-project-item__placeholder" />}
                    <div className="admin-project-item__body"><p className="admin-eyebrow">{String(index + 1).padStart(2, "0")} · {project.slug}</p><h3>{project.name.fa}</h3><a href={project.url} target="_blank" rel="noreferrer">ورود به پروژه</a><span className="admin-media-count">{imageCount} تصویر</span></div>
                    <div className="admin-project-item__actions">
                      <div className="admin-order-actions">
                        <button type="button" onClick={() => moveProject(index, -1)} disabled={index === 0 || isLoading} aria-label="انتقال پروژه به بالا">↑</button>
                        <button type="button" onClick={() => moveProject(index, 1)} disabled={index === projects.length - 1 || isLoading} aria-label="انتقال پروژه به پایین">↓</button>
                      </div>
                      <button type="button" className="admin-edit" onClick={() => handleEdit(project)} disabled={isLoading}>ویرایش</button>
                      <button type="button" className="admin-delete" onClick={() => void handleDelete(project.id)} disabled={isLoading}>حذف</button>
                    </div>
                  </article>
                );
              })}
              {projects.length === 0 && <p className="admin-empty">هنوز پروژه‌ای ثبت نشده است.</p>}
            </div>
          </section>
        </div>
      )}

      {(message || error) && <p className={`admin-feedback ${error ? "admin-feedback--error" : ""}`}>{error || message}</p>}

      {imageViewer && (
        <div className="admin-image-lightbox" role="dialog" aria-modal="true" aria-label="نمایش تصویر پروژه" onClick={() => setImageViewer(null)}>
          <button type="button" className="admin-image-lightbox__close" onClick={() => setImageViewer(null)} aria-label="بستن">×</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageViewer.url} alt={imageViewer.alt || "تصویر پروژه"} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </main>
  );
}
