import { Container } from '@/components/ui/container';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">{children}</div>
    </Container>
  );
}
