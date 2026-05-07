'use client';

/**
 * 신규 상품 등록 폼 (Client Component)
 * - 이름/카테고리/가격/재고/이미지 입력 → createProduct Server Action
 * - 이미지는 Supabase Storage 업로드 지원
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PackagePlus } from 'lucide-react';
import { createProduct } from '@/lib/admin-actions';
import { money } from '@/lib/admin-data';
import { StorageImageUpload } from './storage-image-upload';
import { ActionFeedbackDialog } from './action-dialogs';

const CATEGORIES = ['라켓', '스트링', '피클볼', '신발', '가방', '그립', '기타'];

export function NewProductForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 폼 상태
  const [name, setName] = useState('');
  const [category, setCategory] = useState('라켓');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [tag, setTag] = useState('');
  const [stockQty, setStockQty] = useState('0');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /** 등록 제출 */
  const handleSubmit = () => {
    setErrorMsg(null);

    if (!name.trim()) { setErrorMsg('상품명을 입력해주세요.'); return; }
    if (!category.trim()) { setErrorMsg('카테고리를 선택해주세요.'); return; }

    const parsedPrice = parseInt(price, 10);
    const parsedSalePrice = parseInt(salePrice, 10);
    const parsedStock = parseInt(stockQty, 10);
    const parsedSort = parseInt(sortOrder, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) { setErrorMsg('정가는 0 이상의 숫자로 입력해주세요.'); return; }
    if (isNaN(parsedSalePrice) || parsedSalePrice < 0) { setErrorMsg('판매가는 0 이상의 숫자로 입력해주세요.'); return; }

    startTransition(async () => {
      const result = await createProduct({
        name: name.trim(),
        category: category.trim(),
        price: parsedPrice,
        sale_price: parsedSalePrice,
        image_path: imagePath.trim() || null,
        image_url: null,
        tag: tag.trim() || null,
        stock_quantity: isNaN(parsedStock) ? 0 : parsedStock,
        sort_order: isNaN(parsedSort) ? 0 : parsedSort,
        is_active: isActive,
      });

      if (result.success && result.id) {
        setShowSuccess(true);
      } else {
        setErrorMsg(`등록 실패: ${result.error}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      <ActionFeedbackDialog
        open={showSuccess}
        title="상품이 등록되었습니다"
        description="확인을 누르면 상품 목록으로 이동합니다."
        onConfirm={() => router.push('/admin/products')}
      />
      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm font-semibold">
          ✗ {errorMsg}
        </div>
      )}

      {/* 기본 정보 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-4">기본 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="상품명 *" value={name} onChange={setName} placeholder="예: Wilson Pro Staff 97" />

          {/* 카테고리 선택 */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">카테고리 *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <FormField label="태그" value={tag} onChange={setTag} placeholder="예: 인기, 신제품" />

          {/* 판매 상태 토글 */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">판매 상태</p>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setIsActive(v)}
                  className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition ${
                    isActive === v
                      ? v ? 'bg-chart-4/15 text-chart-4 border-chart-4/30' : 'bg-muted text-muted-foreground border-border'
                      : 'bg-transparent border-border text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {v ? '판매 중' : '비활성'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 가격 및 재고 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-4">가격 및 재고</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">정가 (원) *</label>
            <input
              type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="389000"
              className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {price && !isNaN(parseInt(price)) && (
              <p className="text-[10px] text-muted-foreground mt-1">{money(parseInt(price))}원</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">판매가 (원) *</label>
            <input
              type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(e.target.value)}
              placeholder="329000"
              className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {salePrice && !isNaN(parseInt(salePrice)) && (
              <p className="text-[10px] text-muted-foreground mt-1">{money(parseInt(salePrice))}원</p>
            )}
          </div>
          <FormField label="재고 수량" value={stockQty} onChange={setStockQty} type="number" placeholder="0" />
          <FormField label="정렬 순서" value={sortOrder} onChange={setSortOrder} type="number" placeholder="0" />
        </div>
      </section>

      {/* 이미지 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-4">상품 이미지</h2>
        <StorageImageUpload
          folder="products"
          label="상품 이미지"
          value={imagePath}
          onChange={setImagePath}
        />
      </section>

      {/* 등록 버튼 */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 px-5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition"
        >
          {isPending ? <><Loader2 className="size-4 animate-spin" /> 등록 중...</> : <><PackagePlus className="size-4" /> 상품 등록</>}
        </button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
