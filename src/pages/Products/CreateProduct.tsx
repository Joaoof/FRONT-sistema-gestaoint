import { useState, useRef, useEffect, type FormEvent, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Trash2,
  Check,
  Package,
  Tag,
  Hash,
  Layers,
  Info,
  AlertTriangle,
  Star,
  GripVertical,
} from 'lucide-react';
import { uploadProductImage, validateImage, UploadError, type UploadedAsset } from '../../lib/r2-upload';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { CREATE_PRODUCT_WITH_IMAGES } from '../../graphql/mutations/product-with-images';

type ImageState = {
  id: string;
  file?: File;
  previewUrl: string;
  asset?: UploadedAsset;
  progress: number;       // 0..1
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
};

interface FormData {
  sku: string;
  name: string;
  category: string;
  unit: string;
  description: string;
  costPrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
  weight: string;
  active: boolean;
}

const INITIAL: FormData = {
  sku: '',
  name: '',
  category: '',
  unit: 'UN',
  description: '',
  costPrice: '',
  salePrice: '',
  stock: '',
  minStock: '',
  weight: '',
  active: true,
};

const UNITS = [
  { value: 'UN', label: 'Unidade' },
  { value: 'KG', label: 'Quilograma' },
  { value: 'G',  label: 'Grama' },
  { value: 'L',  label: 'Litro' },
  { value: 'ML', label: 'Mililitro' },
  { value: 'M',  label: 'Metro' },
  { value: 'CM', label: 'Centímetro' },
  { value: 'CX', label: 'Caixa' },
  { value: 'PC', label: 'Pacote' },
];

const CATEGORIES = [
  'Alimentação', 'Bebidas', 'Limpeza', 'Higiene',
  'Eletrônicos', 'Vestuário', 'Móveis', 'Ferramentas', 'Outros',
];

export function CreateProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [images, setImages] = useState<ImageState[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createProduct] = useMutation(CREATE_PRODUCT_WITH_IMAGES);

  // Margem calculada em tempo real
  const cost = parseFloat(form.costPrice.replace(',', '.')) || 0;
  const sale = parseFloat(form.salePrice.replace(',', '.')) || 0;
  const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
  const markup = cost > 0 ? ((sale - cost) / cost) * 100 : 0;

  // Cleanup preview URLs ao desmontar
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  // ───────── IMAGENS ─────────
  function startUpload(file: File) {
    try {
      validateImage(file);
    } catch (e) {
      const msg = e instanceof UploadError ? e.message : 'Arquivo inválido';
      toast.error(msg);
      return;
    }

    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    const next: ImageState = { id, file, previewUrl, progress: 0, status: 'queued' };
    setImages(prev => [...prev, next]);

    // Inicia upload imediatamente
    uploadOne(id, file);
  }

  async function uploadOne(id: string, file: File) {
    setImages(prev => prev.map(i => i.id === id ? { ...i, status: 'uploading' } : i));
    try {
      const asset = await uploadProductImage(
        file,
        'products',
        (p) => setImages(prev => prev.map(i => i.id === id ? { ...i, progress: p } : i)),
      );
      setImages(prev => prev.map(i => i.id === id ? { ...i, asset, progress: 1, status: 'done' } : i));
    } catch (e) {
      const msg = e instanceof UploadError ? e.message : 'Falha no upload';
      setImages(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: msg } : i));
      toast.error(msg);
    }
  }

  function retryImage(id: string) {
    const img = images.find(i => i.id === id);
    if (img?.file) uploadOne(id, img.file);
  }

  function removeImage(id: string) {
    setImages(prev => {
      const target = prev.find(i => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(i => i.id !== id);
    });
  }

  function setPrimary(id: string) {
    setImages(prev => {
      const target = prev.find(i => i.id === id);
      if (!target) return prev;
      return [target, ...prev.filter(i => i.id !== id)];
    });
  }

  // Drag & drop
  function onDragOver(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(true);
  }
  function onDragLeave() { setDragOver(false); }
  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(startUpload);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(startUpload);
    // permite re-selecionar o mesmo arquivo
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ───────── VALIDAÇÃO ─────────
  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.sku.trim())            next.sku = 'Informe o código (SKU)';
    if (!form.name.trim())           next.name = 'Informe o nome do produto';
    if (!form.category)              next.category = 'Selecione uma categoria';
    if (!form.costPrice || cost < 0) next.costPrice = 'Preço de compra inválido';
    if (!form.salePrice || sale <= 0) next.salePrice = 'Preço de venda inválido';
    if (sale > 0 && cost > 0 && sale < cost) next.salePrice = 'Venda menor que compra (margem negativa)';
    if (form.stock && parseInt(form.stock) < 0) next.stock = 'Estoque não pode ser negativo';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ───────── SUBMIT ─────────
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Verifique os campos obrigatórios');
      return;
    }
    if (images.some(i => i.status === 'uploading')) {
      toast.error('Aguarde os uploads terminarem');
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        sku: form.sku.trim() || undefined,
        nameProduct: form.name.trim(),
        unit: form.unit,
        description: form.description.trim() || undefined,
        costPrice: cost,
        salePrice: sale,
        quantity: parseInt(form.stock || '0', 10),
        minStock: parseInt(form.minStock || '0', 10),
        weight: form.weight ? parseFloat(form.weight.replace(',', '.')) : undefined,
        categoryId: form.category || undefined,
        active: form.active,
        images: images.filter(i => i.asset).map((i, idx) => ({
          url: i.asset!.url,
          key: i.asset!.key,
          isPrimary: idx === 0,
          order: idx,
        })),
      };

      await createProduct({ variables: { input } });

      toast.success(`${form.name} cadastrado com sucesso`);
      navigate('/estoque');
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const uploadingCount = images.filter(i => i.status === 'uploading').length;
  const isFormValid = form.sku && form.name && form.category && form.costPrice && form.salePrice;

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-12">
      {/* Header SaaS */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="min-w-0">
          <button
            onClick={() => navigate(-1)}
            type="button"
            className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={2} />
            Voltar
          </button>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Novo produto</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            Cadastre um novo item no seu catálogo · campos com <span className="text-rose-600 dark:text-rose-400">*</span> são obrigatórios
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={!isFormValid || submitting || uploadingCount > 0}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />Salvando…</>
            ) : (
              <><Check className="w-3.5 h-3.5" strokeWidth={2} />Salvar produto</>
            )}
          </button>
        </div>
      </div>

      <form id="product-form" onSubmit={onSubmit} className="space-y-4">
        {/* Imagens */}
        <Section
          tone="violet"
          icon={<ImagePlus className="w-4 h-4" strokeWidth={2} />}
          title="Imagens do produto"
          subtitle="Até 8 imagens · JPG, PNG, WebP · 5 MB cada · a primeira será a capa"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <ImageThumb
                key={img.id}
                image={img}
                isPrimary={idx === 0}
                onRemove={() => removeImage(img.id)}
                onRetry={() => retryImage(img.id)}
                onSetPrimary={() => setPrimary(img.id)}
              />
            ))}
            {images.length < 8 && (
              <label
                htmlFor="image-upload"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`group relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                    : 'border-slate-200 dark:border-white/[0.10] hover:border-slate-300 dark:hover:border-white/15 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="w-8 h-8 rounded-md bg-violet-50 text-violet-700 ring-1 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ImagePlus className="w-4 h-4" strokeWidth={2} />
                </div>
                <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">Adicionar</p>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-500">arraste ou clique</p>
                <input
                  id="image-upload"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  onChange={onFileChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>
          {uploadingCount > 0 && (
            <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-violet-500" strokeWidth={2.5} />
              Enviando {uploadingCount} {uploadingCount === 1 ? 'imagem' : 'imagens'}…
            </p>
          )}
        </Section>

        {/* Informações básicas */}
        <Section
          tone="sky"
          icon={<Tag className="w-4 h-4" strokeWidth={2} />}
          title="Informações básicas"
          subtitle="Identificação e categorização"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Código (SKU)"
              required
              error={errors.sku}
              icon={<Hash className="w-3.5 h-3.5" strokeWidth={1.75} />}
              hint="Ex: PROD-0001, ABC-123"
            >
              <input
                type="text"
                value={form.sku}
                onChange={(e) => update('sku', e.target.value.toUpperCase())}
                placeholder="PROD-0001"
                className={inputClass(!!errors.sku)}
              />
            </Field>

            <Field label="Unidade" required>
              <select
                value={form.unit}
                onChange={(e) => update('unit', e.target.value)}
                className={inputClass()}
              >
                {UNITS.map(u => <option key={u.value} value={u.value}>{u.label} ({u.value})</option>)}
              </select>
            </Field>

            <Field
              label="Nome do produto"
              required
              error={errors.name}
              className="sm:col-span-2"
            >
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ex: Notebook Dell Inspiron 15"
                className={inputClass(!!errors.name)}
              />
            </Field>

            <Field label="Categoria" required error={errors.category} className="sm:col-span-2">
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className={inputClass(!!errors.category)}
              >
                <option value="">Selecione uma categoria…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Descrição" hint="Detalhes que aparecerão no catálogo (opcional)" className="sm:col-span-2">
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={3}
                placeholder="Descreva características, especificações técnicas, etc."
                className={inputClass(false, true)}
              />
            </Field>
          </div>
        </Section>

        {/* Preços */}
        <Section
          tone="emerald"
          icon={<Layers className="w-4 h-4" strokeWidth={2} />}
          title="Preços"
          subtitle="Margem e markup calculados em tempo real"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field
              label="Preço de compra"
              required
              error={errors.costPrice}
              className="lg:col-span-1"
            >
              <PrefixInput prefix="R$">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.costPrice}
                  onChange={(e) => update('costPrice', e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="0,00"
                  className={inputClass(!!errors.costPrice) + ' pl-9'}
                />
              </PrefixInput>
            </Field>

            <Field
              label="Preço de venda"
              required
              error={errors.salePrice}
            >
              <PrefixInput prefix="R$">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.salePrice}
                  onChange={(e) => update('salePrice', e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="0,00"
                  className={inputClass(!!errors.salePrice) + ' pl-9'}
                />
              </PrefixInput>
            </Field>

            <ReadonlyMetric
              label="Margem"
              value={`${margin.toFixed(1)}%`}
              tone={margin >= 30 ? 'emerald' : margin >= 15 ? 'amber' : margin > 0 ? 'rose' : 'slate'}
              hint="(venda - compra) / venda"
            />

            <ReadonlyMetric
              label="Markup"
              value={`${markup.toFixed(1)}%`}
              tone={markup >= 50 ? 'emerald' : markup >= 25 ? 'amber' : markup > 0 ? 'rose' : 'slate'}
              hint="(venda - compra) / compra"
            />
          </div>
        </Section>

        {/* Estoque */}
        <Section
          tone="amber"
          icon={<Package className="w-4 h-4" strokeWidth={2} />}
          title="Estoque"
          subtitle="Quantidade atual e ponto de reposição"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Estoque atual" error={errors.stock}>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => update('stock', e.target.value)}
                placeholder="0"
                className={inputClass(!!errors.stock)}
              />
            </Field>
            <Field label="Estoque mínimo" hint="Alerta quando atingir esse nível">
              <input
                type="number"
                min="0"
                value={form.minStock}
                onChange={(e) => update('minStock', e.target.value)}
                placeholder="10"
                className={inputClass()}
              />
            </Field>
            <Field label="Peso (kg)" hint="Para cálculo de frete (opcional)">
              <input
                type="text"
                inputMode="decimal"
                value={form.weight}
                onChange={(e) => update('weight', e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="0,00"
                className={inputClass()}
              />
            </Field>
          </div>
        </Section>

        {/* Status */}
        <Section
          tone="slate"
          icon={<Info className="w-4 h-4" strokeWidth={2} />}
          title="Status"
          subtitle="Disponibilidade no catálogo"
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => update('active', !form.active)}
              role="switch"
              aria-checked={form.active}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                form.active ? 'bg-violet-600' : 'bg-slate-300 dark:bg-white/[0.10]'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${
                  form.active ? 'translate-x-[18px]' : 'translate-x-1'
                }`}
              />
            </button>
            <div>
              <p className="text-[13px] font-medium text-slate-900 dark:text-white">
                Produto {form.active ? 'ativo' : 'inativo'}
              </p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                {form.active
                  ? 'Aparece em vendas, consultas e relatórios'
                  : 'Oculto nas operações do dia a dia'}
              </p>
            </div>
          </label>
        </Section>

        {/* Footer actions (mobile) */}
        <div className="flex sm:hidden items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 text-[13px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] rounded-md"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isFormValid || submitting || uploadingCount > 0}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 text-[13px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 rounded-md disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────── Subcomponentes ───────────────

function inputClass(hasError = false, isTextarea = false) {
  return `block w-full ${isTextarea ? 'py-2.5' : 'h-9'} px-3 text-[13px] bg-white dark:bg-slate-900 border ${
    hasError
      ? 'border-rose-300 dark:border-rose-500/40 focus:border-rose-500 focus:ring-rose-500/15'
      : 'border-slate-200 dark:border-white/[0.10] focus:border-violet-500 focus:ring-violet-500/15 hover:border-slate-300 dark:hover:border-white/15'
  } rounded-md text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-[3px] transition-colors disabled:opacity-50`;
}

function Section({
  tone,
  icon,
  title,
  subtitle,
  children,
}: {
  tone: 'violet' | 'sky' | 'emerald' | 'amber' | 'rose' | 'slate';
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const tones = {
    violet:  'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
    sky:     'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
    amber:   'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    rose:    'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
    slate:   'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/[0.08]',
  } as const;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <span className={`w-8 h-8 rounded-md ring-1 flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </span>
        <div>
          <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  icon,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="flex items-center gap-1 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span>{label}</span>
        {required && <span className="text-rose-600 dark:text-rose-400">*</span>}
      </label>
      {children}
      {(error || hint) && (
        <p className={`mt-1 text-[11.5px] ${error ? 'text-rose-600 dark:text-rose-400 inline-flex items-center gap-1' : 'text-slate-500 dark:text-slate-400'}`}>
          {error && <AlertTriangle className="w-3 h-3" strokeWidth={2.25} />}
          {error || hint}
        </p>
      )}
    </div>
  );
}

function PrefixInput({ prefix, children }: { prefix: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-slate-400 dark:text-slate-500 pointer-events-none">
        {prefix}
      </span>
      {children}
    </div>
  );
}

function ReadonlyMetric({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: 'emerald' | 'amber' | 'rose' | 'slate';
  hint?: string;
}) {
  const tones = {
    emerald: 'text-emerald-700 dark:text-emerald-400',
    amber:   'text-amber-700 dark:text-amber-400',
    rose:    'text-rose-700 dark:text-rose-400',
    slate:   'text-slate-700 dark:text-slate-300',
  } as const;
  const accent = {
    emerald: 'bg-emerald-500',
    amber:   'bg-amber-500',
    rose:    'bg-rose-500',
    slate:   'bg-slate-300 dark:bg-white/10',
  } as const;

  return (
    <div className="relative bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-md p-3 overflow-hidden">
      <span className={`absolute inset-x-0 top-0 h-[2px] ${accent[tone]} opacity-70`} aria-hidden />
      <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-[18px] font-semibold leading-none mt-2 tabular-nums ${tones[tone]}`}>{value}</p>
      {hint && <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function ImageThumb({
  image,
  isPrimary,
  onRemove,
  onRetry,
  onSetPrimary,
}: {
  image: ImageState;
  isPrimary: boolean;
  onRemove: () => void;
  onRetry: () => void;
  onSetPrimary: () => void;
}) {
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
      <img src={image.previewUrl} alt="" className="w-full h-full object-cover" />

      {/* Status overlays */}
      {image.status === 'uploading' && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-white animate-spin" strokeWidth={2.5} />
          <div className="w-3/4 h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-[width]" style={{ width: `${image.progress * 100}%` }} />
          </div>
          <span className="text-[10.5px] font-medium text-white tabular-nums">{Math.round(image.progress * 100)}%</span>
        </div>
      )}

      {image.status === 'error' && (
        <div className="absolute inset-0 bg-rose-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 p-2 text-center">
          <AlertTriangle className="w-4 h-4 text-rose-100" strokeWidth={2.5} />
          <span className="text-[10.5px] font-medium text-rose-100">Falha</span>
          <button
            type="button"
            onClick={onRetry}
            className="text-[10.5px] font-medium text-white underline underline-offset-2"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {/* Badge primário */}
      {isPrimary && image.status === 'done' && (
        <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-white bg-violet-600 rounded shadow-sm">
          <Star className="w-2.5 h-2.5 fill-current" />
          Capa
        </span>
      )}

      {/* Ações no hover */}
      {image.status === 'done' && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-slate-900/80 to-transparent flex items-center justify-end gap-1">
            {!isPrimary && (
              <button
                type="button"
                onClick={onSetPrimary}
                title="Definir como capa"
                className="w-6 h-6 flex items-center justify-center rounded bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm"
              >
                <Star className="w-3 h-3" strokeWidth={2.25} />
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
              title="Remover"
              className="w-6 h-6 flex items-center justify-center rounded bg-white/15 hover:bg-rose-500/80 text-white backdrop-blur-sm"
            >
              <Trash2 className="w-3 h-3" strokeWidth={2.25} />
            </button>
          </div>
          <div className="absolute top-1.5 right-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white">
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
          </div>
        </div>
      )}

      {/* Drag handle */}
      {image.status === 'done' && !isPrimary && (
        <span className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded bg-white/15 backdrop-blur-sm flex items-center justify-center text-white" title="Arraste para reordenar">
          <GripVertical className="w-3 h-3" strokeWidth={2.25} />
        </span>
      )}
    </div>
  );
}
