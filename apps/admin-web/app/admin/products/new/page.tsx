import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { NewProductForm } from '@/components/admin/new-product-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminNewProductPage() {
  return (
    <div>
      <AdminPageHeader
        label="PRODUCT CATALOG"
        title="신규 상품 등록"
        description="새 상품을 등록합니다. 등록 완료 후 상세 편집 페이지로 자동 이동됩니다."
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
      <NewProductForm />
    </div>
  );
}
