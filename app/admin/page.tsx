"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface AdminProject {
  id: number;
  slug: string;
  num: string;
  name: { fa: string; en: string };
  desc: { fa: string; en: string };
  url: string;
  media: string[];
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

const EMPTY_FORM: ProjectForm = {
  titleFa: "",
  titleEn: "",
  descriptionFa: "",
  descriptionEn: "",
  url: "",
  stack: "",
};

const TOKEN_KEY = "portfolio-admin-token";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProjects = async (adminToken: string) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/projects", {
        headers: { "x-admin-token": adminToken },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || payload.error || "دسترسی به پنل ممکن نیست.");
      setProjects(payload);
      setToken(adminToken);
      setTokenInput(adminToken);
      sessionStorage.setItem(TOKEN_KEY, adminToken);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "اتصال به پنل برقرار نشد.");
      sessionStorage.removeItem(TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) void loadProjects(saved);
  }, []);

  const handleTokenSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (tokenInput.trim()) void loadProjects(tokenInput.trim());
  };

  const handleFormChange = (field: keyof ProjectForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFiles([]);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (project: AdminProject) => {
    setEditingId(project.id);
    setForm({
      titleFa: project.name.fa,
      titleEn: project.name.en,
      descriptionFa: project.desc.fa,
      descriptionEn: project.desc.en,
      url: project.url,
      stack: project.stack.join(", "),
    });
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
    setIsLoading(true);
    try {
      const body = new FormData();
      body.append("title_fa", form.titleFa);
      body.append("title_en", form.titleEn);
      body.append("description_fa", form.descriptionFa);
      body.append("description_en", form.descriptionEn);
      body.append("project_url", form.url);
      body.append("stack", form.stack);
      if (editingId !== null) body.append("replace_images", String(files.length > 0));
      files.forEach((file) => body.append("images", file));

      const response = await fetch(
        editingId === null ? "/api/admin/projects" : `/api/admin/projects/${editingId}`,
        {
        method: editingId === null ? "POST" : "PUT",
        headers: { "x-admin-token": token },
        body,
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || payload.error || "ذخیره‌ی پروژه انجام نشد.");
      if (editingId === null) {
        setProjects((current) => [...current, payload]);
        setMessage("پروژه با موفقیت اضافه شد.");
      } else {
        setProjects((current) => current.map((project) => project.id === editingId ? payload : project));
        setMessage("تغییرات پروژه با موفقیت ذخیره شد.");
      }
      resetForm();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ذخیره‌ی پروژه انجام نشد.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (projectId: number) => {
    if (!token || !window.confirm("این پروژه حذف شود؟")) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      const payload = await response.json();
      if (!response.ok || !payload.deleted) throw new Error("حذف پروژه انجام نشد.");
      setProjects((current) => current.filter((project) => project.id !== projectId));
      setMessage("پروژه حذف شد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "حذف پروژه انجام نشد.");
    }
  };

  return (
    <main className="admin-shell" dir="rtl">
      <div className="admin-shell__topbar">
        <div>
          <p className="admin-eyebrow">PORTFOLIO CMS</p>
          <h1>مدیریت پروژه‌ها</h1>
          <p>پروژه‌ها، لینک نمایش و تصاویرشان را از اینجا مدیریت کنید.</p>
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
              <label>لینک نمایش پروژه<input required type="url" placeholder="https://example.com" value={form.url} onChange={(event) => handleFormChange("url", event.target.value)} /></label>
              <label>تکنولوژی‌ها <span>(با ویرگول جدا کنید)</span><input placeholder="React, Next.js, PostgreSQL" value={form.stack} onChange={(event) => handleFormChange("stack", event.target.value)} /></label>
              <label>تصاویر پروژه <span>{editingId === null ? "حداکثر ۸ مگابایت برای هر تصویر" : "اختیاری؛ با انتخاب تصویر جدید، گالری قبلی جایگزین می‌شود"}<input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} /></span></label>
              {files.length > 0 && <p className="admin-file-count">{files.length} تصویر برای آپلود انتخاب شده است.</p>}
              <div className="admin-form-actions">
                <button type="submit" className="frost-btn frost-btn--primary" disabled={isLoading}>{isLoading ? "در حال ذخیره…" : editingId === null ? "افزودن پروژه" : "ذخیره‌ی تغییرات"}</button>
                {editingId !== null && <button type="button" className="frost-btn" onClick={resetForm} disabled={isLoading}>انصراف</button>}
              </div>
            </form>
          </section>

          <section className="admin-panel">
            <div className="admin-list-heading"><div><p className="admin-eyebrow">محتوای فعلی</p><h2>پروژه‌ها</h2></div><span>{projects.length} مورد</span></div>
            <div className="admin-project-list">
              {projects.map((project) => (
                <article key={project.id} className="admin-project-item">
                  {project.media[0] ? (
                    // MinIO may live on a separate host, so this preview uses
                    // the remote object URL directly instead of next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.media[0]} alt="" />
                  ) : <div className="admin-project-item__placeholder" />}
                  <div className="admin-project-item__body"><p className="admin-eyebrow">{project.num} · {project.slug}</p><h3>{project.name.fa}</h3><a href={project.url} target="_blank" rel="noreferrer">پیش‌نمایش پروژه</a></div>
                  <div className="admin-project-item__actions">
                    <button type="button" className="admin-edit" onClick={() => handleEdit(project)}>ویرایش</button>
                    <button type="button" className="admin-delete" onClick={() => void handleDelete(project.id)}>حذف</button>
                  </div>
                </article>
              ))}
              {projects.length === 0 && <p className="admin-empty">هنوز پروژه‌ای ثبت نشده است.</p>}
            </div>
          </section>
        </div>
      )}

      {(message || error) && <p className={`admin-feedback ${error ? "admin-feedback--error" : ""}`}>{error || message}</p>}
    </main>
  );
}
