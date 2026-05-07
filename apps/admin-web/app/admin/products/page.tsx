import { AdminPageHeader } from '@/components/admin/admin-page-header';
import {
  ProductStockEditor,
  ProductActiveToggle,
} from '@/components/admin/product-row-actions';
import { getAdminProductsPageData, money } from '@/lib/admin-data';
import { Plus, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default async function AdminProductsPage() {
  const products = await getAdminProductsPageData();
  const categories = ['전체', ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <div>
      <AdminPageHeader
        label="PRODUCT CATALOG"
        title="상품 관리"
        description="shop_products 테이블의 실제 상품 데이터를 표시합니다. 상품명 또는 상세 아이콘을 클릭하면 편집 페이지로 이동합니다."
        actions={
          <>
            <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary">
              가져오기
            </button>
            <Link
              href="/admin/products/new"
              className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90"
            >
              <Plus className="size-3.5" />
              상품 등록
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex-1 min-w-64 h-9 rounded-lg bg-card border border-border px-3 flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            placeholder="SKU, 상품명 검색"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        {categories.map((c, i) => (
          <button
            key={c}
            className={`h-9 px-3 rounded-lg text-xs font-semibold ${
              i === 0
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:bg-secondary'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-muted-foreground text-xs">
            <tr>
              <th className="text-left font-semibold px-4 py-3 w-12">
                <input type="checkbox" className="accent-primary" />
              </th>
              <th className="text-left font-semibold px-4 py-3">상품</th>
              <th className="text-left font-semibold px-4 py-3">SKU</th>
              <th className="text-left font-semibold px-4 py-3">카테고리</th>
              <th className="text-right font-semibold px-4 py-3">가격</th>
              <th className="text-right font-semibold px-4 py-3">재고 ✎</th>
              <th className="text-left font-semibold px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-xs text-muted-foreground"
                  colSpan={7}
                >
                  상품 데이터가 없습니다.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.sku} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="accent-primary" />
                  </td>
                  {/* 상품명 클릭 → 상세 페이지 */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="size-10 rounded-lg bg-secondary overflow-hidden grid place-items-center shrink-0">
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="font-semibold text-foreground group-hover:text-primary group-hover:underline transition-colors">
                        {p.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {p.sku.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3 text-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {money(p.salePrice)}원
                  </td>
                  <td className="px-4 py-3 text-right">
                    {/* ✅ 클릭하여 재고 인라인 편집 */}
                    <ProductStockEditor productId={p.id} initialStock={p.stock} />
                  </td>
                  <td className="px-4 py-3">
                    {/* ✅ 활성/비활성 토글 버튼 */}
                    <ProductActiveToggle productId={p.id} initialActive={p.isActive} />
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
          총 {products.length}개 상품
        </div>
      </div>
    </div>
  );
}
