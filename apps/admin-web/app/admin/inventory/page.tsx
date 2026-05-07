import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { getAdminInventoryPageData } from '@/lib/admin-data';
import {
  AlertTriangle,
  Boxes,
  Link2Off,
  Tag,
  TrendingDown,
} from 'lucide-react';

/** 카테고리 아이콘/색상 맵 */
const CATEGORY_STYLES: Record<string, { emoji: string; color: string; bg: string }> = {
  라켓: { emoji: '🎾', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-100/60 dark:bg-yellow-900/30' },
  스트링: { emoji: '🪢', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100/60 dark:bg-purple-900/30' },
  신발: { emoji: '👟', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100/60 dark:bg-blue-900/30' },
  가방: { emoji: '🎒', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100/60 dark:bg-green-900/30' },
  피클볼: { emoji: '🏓', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100/60 dark:bg-orange-900/30' },
};

const DEFAULT_STYLE = {
  emoji: '📦',
  color: 'text-muted-foreground',
  bg: 'bg-muted/40',
};

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? DEFAULT_STYLE;
}

function StockBadge({ stock, threshold = 10 }: { stock: number; threshold?: number }) {
  if (stock === 0) {
    return (
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
        품절
      </span>
    );
  }
  if (stock <= Math.floor(threshold / 2)) {
    return (
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
        긴급
      </span>
    );
  }
  if (stock <= threshold) {
    return (
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-chart-4/15 text-chart-4">
        재주문 필요
      </span>
    );
  }
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
      정상
    </span>
  );
}

export default async function AdminInventoryPage() {
  const inventory = await getAdminInventoryPageData();

  const topCards = [
    {
      icon: Boxes,
      label: '총 SKU',
      value: `${inventory.stats.totalSku}`,
      tone: 'bg-primary/10 text-primary',
    },
    {
      icon: AlertTriangle,
      label: '재주문 필요',
      value: `${inventory.stats.lowStock}`,
      tone: 'bg-chart-4/15 text-chart-4',
    },
    {
      icon: TrendingDown,
      label: '품절',
      value: `${inventory.stats.outOfStock}`,
      tone: 'bg-destructive/10 text-destructive',
    },
    {
      icon: Tag,
      label: '서비스 스트링',
      value: `${inventory.stats.serviceStringCount}`,
      tone: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div>
      <AdminPageHeader
        label="INVENTORY"
        title="재고"
        description="카테고리별 상품 재고 및 서비스 스트링 현황을 확인합니다."
        actions={
          <>
            <button className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-secondary">
              재고 실사
            </button>
            <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90">
              발주 생성
            </button>
          </>
        }
      />

      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {topCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
              <div className={`size-9 rounded-lg grid place-items-center ${s.tone}`}>
                <Icon className="size-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">{s.label}</p>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── 서비스 스트링 경고 배너 ─────────────────────────────── */}
      {inventory.stats.unlinkedCount > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-50/60 dark:bg-amber-900/20 px-5 py-4">
          <Link2Off className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              재고 연결 안 된 서비스 스트링 {inventory.stats.unlinkedCount}개
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
              아래 스트링은 사용자 앱 예약에서 선택 가능하지만{' '}
              <code className="bg-amber-200/60 dark:bg-amber-800/60 px-1 rounded">shop_products</code>에
              재고 항목이 없어 실물 재고 추적이 불가능합니다.{' '}
              {inventory.unlinkedServiceStrings.map((s) => `${s.brand} ${s.name}`).join(' / ')}
            </p>
          </div>
        </div>
      )}

      {/* ── 카테고리별 재고 테이블 ──────────────────────────────── */}
      <div className="space-y-5 mb-6">
        {inventory.categories.map((group) => {
          const style = getCategoryStyle(group.category);
          return (
            <section key={group.category} className="bg-card rounded-2xl border border-border overflow-hidden">
              {/* 카테고리 헤더 */}
              <header className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30">
                <span className={`size-8 rounded-lg grid place-items-center text-sm ${style.bg}`}>
                  {style.emoji}
                </span>
                <h2 className={`font-display font-bold text-base ${style.color}`}>
                  {group.category}
                </h2>
                <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
                  <span>SKU <strong className="text-foreground">{group.skuCount}</strong></span>
                  <span>총 재고 <strong className="text-foreground">{group.totalStock.toLocaleString()}</strong></span>
                  {group.outOfStock > 0 && (
                    <span className="text-destructive font-semibold">품절 {group.outOfStock}</span>
                  )}
                  {group.lowStock > 0 && (
                    <span className="text-chart-4 font-semibold">부족 {group.lowStock}</span>
                  )}
                </div>
              </header>

              {/* 상품 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] table-fixed text-sm">
                  <colgroup>
                    <col className="w-[44%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[12%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="text-left px-5 py-2 font-medium">상품명</th>
                      <th className="text-right px-5 py-2 font-medium">정가</th>
                      <th className="text-right px-5 py-2 font-medium">판가</th>
                      <th className="text-right px-5 py-2 font-medium">재고</th>
                      <th className="text-center px-5 py-2 font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground text-sm">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground">{item.sku}</p>
                        </td>
                        <td className="px-5 py-3 text-right text-muted-foreground">
                          {item.price.toLocaleString()}원
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-foreground">
                          {item.salePrice.toLocaleString()}원
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={`font-bold text-base ${
                              item.stock === 0
                                ? 'text-destructive'
                                : item.stock <= 5
                                  ? 'text-destructive'
                                  : item.stock <= 10
                                    ? 'text-chart-4'
                                    : 'text-foreground'
                            }`}
                          >
                            {item.stock}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <StockBadge stock={item.stock} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── 서비스 스트링 현황 (string_catalog) ─────────────────── */}
      <section className="bg-card rounded-2xl border border-border overflow-hidden">
        <header className="flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/30">
          <span className="size-8 rounded-lg grid place-items-center text-sm bg-purple-100/60 dark:bg-purple-900/30">
            🪢
          </span>
          <h2 className="font-display font-bold text-base text-purple-700 dark:text-purple-400">
            서비스 스트링 목록
          </h2>
          <p className="text-xs text-muted-foreground ml-1">
            사용자 앱 예약 화면에서 선택 가능한 스트링 카탈로그
          </p>
          <span className="ml-auto text-xs text-muted-foreground">
            총 {inventory.serviceCatalog.length}개
          </span>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-sm">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[26%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left px-5 py-2 font-medium">브랜드</th>
                <th className="text-left px-5 py-2 font-medium">스트링명</th>
                <th className="text-center px-5 py-2 font-medium">굵기</th>
                <th className="text-right px-5 py-2 font-medium">서비스가</th>
                <th className="text-right px-5 py-2 font-medium">연결 재고</th>
                <th className="text-center px-5 py-2 font-medium">예약 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventory.serviceCatalog.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {item.brand}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-foreground">{item.name}</td>
                  <td className="px-5 py-3 text-center text-muted-foreground">
                    {item.gauge ?? '-'}
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">
                    {item.price != null ? `${item.price.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {item.linkedStock !== null ? (
                      <span
                        className={`font-bold ${
                          item.linkedStock === 0
                            ? 'text-destructive'
                            : item.linkedStock <= 10
                              ? 'text-chart-4'
                              : 'text-foreground'
                        }`}
                      >
                        {item.linkedStock}
                      </span>
                    ) : (
                      <span className="flex items-center justify-end gap-1 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                        <Link2Off className="size-3" />
                        미연결
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {item.isActive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        예약 가능
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        비활성
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 안내 박스 */}
        <div className="px-5 py-3 bg-muted/20 border-t border-border">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">연결 재고</strong>는{' '}
            <code className="bg-muted px-1 rounded">shop_products</code>의 스트링 카테고리 항목과
            이름 기반으로 매칭된 재고 수량입니다.{' '}
            <strong className="text-amber-600 dark:text-amber-400">미연결</strong> 스트링은 사용자가
            예약 시 선택할 수 있지만 실물 재고 추적이 되지 않으므로,{' '}
            <code className="bg-muted px-1 rounded">shop_products</code>에 해당 스트링을 등록하거나,
            서비스 스트링에 재고 필드 추가를 검토하세요.
          </p>
        </div>
      </section>
    </div>
  );
}
