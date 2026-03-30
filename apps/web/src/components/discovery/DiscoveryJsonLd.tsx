type DiscoveryJsonLdProps = {
  data: Record<string, unknown>;
};

export function DiscoveryJsonLd({ data }: DiscoveryJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
