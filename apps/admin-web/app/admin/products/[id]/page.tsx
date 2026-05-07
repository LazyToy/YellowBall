import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { ProductDetailForm } from '@/components/admin/product-detail-form';
import { getStorageUrl, loadShopProductById, money } from '@/lib/admin-data';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await loadShopProductById(id);

  if (!product) {
    notFound();
  }

  const stockStatus =
    !product.is_active ? '비활성'
    : product.stock_quantity === 0 ? '품절'
    : '판매 중';

  const stockColor =
    !product.is_active ? 'text-muted-foreground'
    : product.stock_quantity === 0 ? 'text-destructive'
    : product.stock_quantity < 10 ? 'text-chart-4'
    : 'text-chart-4';
  const productImageUrl = getStorageUrl(product.image_path ?? product.image_url);

  return (
    <div>
      <AdminPageHeader
        label="PRODUCT CATALOG"
        title={product.name}
        description={`shop_products.id = ${product.id}`}
        actions={
          <Link
            href="/admin/products"
            className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            목록으로
          </Link>
        }
      />

      {/* 현재 상태 요약 카드 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* 이미지 미리보기 */}
        <div className="w-full sm:w-40 h-32 rounded-2xl bg-card border border-border overflow-hidden grid place-items-center shrink-0">
          {productImageUrl ? (
            <Image
              src={productImageUrl}
              alt={product.name}
              width={160}
              height={128}
              className="object-contain w-full h-full"
            />
          ) : (
            <span className="text-xs text-muted-foreground">이미지 없음</span>
          )}
        </div>

        {/* 요약 정보 */}
        <div className="flex-1 bg-card border border-border rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
          <SummaryCard
            label="판매 상태"
            value={stockStatus}
            colorClass={
              stockStatus === '판매 중'
                ? 'text-chart-4'
                : stockStatus === '품절'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
            }
          />
          <SummaryCard label="카테고리" value={product.category} />
          <SummaryCard label="태그" value={product.tag ?? '-'} />
          <SummaryCard label="정가" value={`${money(product.price)}원`} />
          <SummaryCard label="판매가" value={`${money(product.sale_price)}원`} />
          <SummaryCard
            label="재고"
            value={`${product.stock_quantity}개`}
            colorClass={stockColor}
          />
        </div>
      </div>

      {/* 편집 폼 */}
      <ProductDetailForm product={product} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  colorClass = 'text-foreground',
}: {
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-semibold text-sm ${colorClass}`}>{value}</p>
    </div>
  );
}
