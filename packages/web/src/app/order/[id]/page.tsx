import OrderStatus from '@/components/OrderStatus';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <section className="wrap" style={{ padding: '48px 20px' }}>
      <OrderStatus orderId={id} />
    </section>
  );
}
