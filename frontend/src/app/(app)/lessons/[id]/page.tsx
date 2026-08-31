import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [{ id: 'demo' }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <ClientPage />;
}
