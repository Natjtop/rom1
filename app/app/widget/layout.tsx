/**
 * Widget embed layout: force transparent background so no white flash in iframe.
 * Script runs first (when parsed); style reinforces. Both target html and body.
 */
export default function WidgetLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <>
      {/* First: force transparent from first paint to avoid white flash; no dependency on class. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `html,body{background:transparent!important;background-color:transparent!important;min-height:100%;height:100%;min-height:100dvh;overflow:visible}`,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var d=document;d.documentElement.classList.add('replyma-widget-embed');d.body&&d.body.classList.add('replyma-widget-embed');d.documentElement.style.background='transparent';d.documentElement.style.backgroundColor='transparent';if(d.body){d.body.style.background='transparent';d.body.style.backgroundColor='transparent';}})();`,
        }}
      />
      {children}
    </>
  );
}
