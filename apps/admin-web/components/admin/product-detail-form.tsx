'use client';

/**
 * 상품 상세 편집 폼 (Client Component)
 * - 이름, 카테고리, 정가, 판매가, 이미지, 태그, 재고, 정렬순서, 활성 여부 편집
 * - 저장 시 updateProductDetail Server Action 호출
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { updateProductDetail } from '@/lib/admin-actions';
import { money } from '@/lib/admin-data';
import type { ShopProductRow } from '@/lib/admin-data';
import { StorageImageUpload } from './storage-image-upload';
import { ActionFeedbackDialog } from './action-dialogs';

interface ProductDetailFormProps {
  product: ShopProductRow;
}

/** 상품 상세 편집 폼 */
export function ProductDetailForm({ product }: ProductDetailFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 폼 상태
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(String(product.price));
  const [salePrice, setSalePrice] = useState(String(product.sale_price));
  const [imagePath, setImagePath] = useState(
    product.image_path ?? product.image_url ?? '',
  );
  const [tag, setTag] = useState(product.tag ?? '');
  const [stockQuantity, setStockQuantity] = useState(String(product.stock_quantity));
  const [sortOrder, setSortOrder] = useState(String(product.sort_order));
  const [isActive, setIsActive] = useState(product.is_active);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /** 저장 핸들러 */
  const handleSave = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // 숫자 검증
    const parsedPrice = parseInt(price, 10);
    const parsedSalePrice = parseInt(salePrice, 10);
    const parsedStock = parseInt(stockQuantity, 10);
    const parsedSort = parseInt(sortOrder, 10);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('정가는 0 이상의 숫자로 입력해주세요.');
      return;
    }
    if (isNaN(parsedSalePrice) || parsedSalePrice < 0) {
      setErrorMsg('판매가는 0 이상의 숫자로 입력해주세요.');
      return;
    }
    if (isNaN(parsedStock) || parsedStock < 0) {
      setErrorMsg('재고 수량은 0 이상의 숫자로 입력해주세요.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('상품명을 입력해주세요.');
      return;
    }

    startTransition(async () => {
      try {
        const nextImageValue = imagePath.trim() || null;
        const isLegacyImageUnchanged =
          !product.image_path &&
          Boolean(product.image_url) &&
          nextImageValue === product.image_url;
        const result = await updateProductDetail(product.id, {
          name: name.trim(),
          category: category.trim(),
          price: parsedPrice,
          sale_price: parsedSalePrice,
          image_path: isLegacyImageUnchanged ? null : nextImageValue,
          image_url: isLegacyImageUnchanged ? product.image_url : null,
          tag: tag.trim() || null,
          stock_quantity: parsedStock,
          sort_order: isNaN(parsedSort) ? 0 : parsedSort,
          is_active: isActive,
        });

        if (result.success) {
          setShowSuccess(true);
        } else {
          setErrorMsg(`저장 실패: ${result.error}`);
        }
      } catch (err) {
        setErrorMsg(`오류: ${err}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      <ActionFeedbackDialog
        open={showSuccess}
        title="상품 정보가 저장되었습니다"
        description="확인을 누르면 상품 목록으로 이동합니다."
        onConfirm={() => router.push('/admin/products')}
      />
      {/* 피드백 메시지 */}
      {successMsg && (
        <div className="rounded-lg bg-chart-4/15 text-chart-4 px-4 py-3 text-sm font-semibold">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm font-semibold">
          ✗ {errorMsg}
        </div>
      )}

      {/* 기본 정보 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-display font-bold text-foreground mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          기본 정보
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="상품명" value={name} onChange={setName} placeholder="상품명 입력" />
          <FormField
            label="카테고리"
            value={category}
            onChange={setCategory}
            placeholder="예: string, grip, bag"
          />
          <FormField
            label="태그"
            value={tag}
            onChange={setTag}
            placeholder="예: 인기, 신제품, 할인"
          />
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">판매 상태</p>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-semibold transition ${
                isActive
                  ? 'bg-chart-4/15 text-chart-4 border-chart-4/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {isActive ? (
                <><ToggleRight className="size-4" /> 판매 중</>
              ) : (
                <><ToggleLeft className="size-4" /> 비활성</>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 가격 및 재고 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-display font-bold text-foreground mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          가격 및 재고
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              정가 (원)
            </label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {price && !isNaN(parseInt(price)) && (
              <p className="text-[10px] text-muted-foreground mt-1">{money(parseInt(price))}원</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              판매가 (원)
            </label>
            <input
              type="number"
              min={0}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {salePrice && !isNaN(parseInt(salePrice)) && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {money(parseInt(salePrice))}원
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              재고 수량
            </label>
            <input
              type="number"
              min={0}
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className={`w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                parseInt(stockQuantity) === 0
                  ? 'text-destructive font-semibold'
                  : parseInt(stockQuantity) < 10
                    ? 'text-chart-4 font-semibold'
                    : 'text-foreground'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              정렬 순서
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
              className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              숫자가 작을수록 쇼핑 목록 상단에 표시됩니다. (0 = 최상단)
            </p>
          </div>
        </div>
      </section>

      {/* 이미지 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-display font-bold text-foreground mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          이미지
        </h2>
        <StorageImageUpload
          folder="products"
          label="상품 이미지"
          value={imagePath}
          onChange={setImagePath}
        />
      </section>

      {/* 읽기 전용 메타 정보 */}
      <section className="bg-card rounded-2xl border border-border p-5">
        <h2 className="font-display font-bold text-foreground mb-4 text-sm uppercase tracking-wide text-muted-foreground">
          메타 정보 (읽기 전용)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <LabelValue label="상품 ID (SKU)" value={product.id} mono />
          <LabelValue label="평점" value={`${product.rating_average} (${product.review_count}건)`} />
          <LabelValue
            label="등록일"
            value={new Date(product.created_at).toLocaleDateString('ko-KR')}
          />
        </div>
      </section>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isPending ? '저장 중...' : '변경사항 저장'}
        </button>
      </div>
    </div>
  );
}

/** 레이블 + 읽기 전용 값 */
function LabelValue({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-semibold text-foreground text-sm break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '-'}
      </p>
    </div>
  );
}

/** 공통 텍스트 인풋 */
function FormField({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
