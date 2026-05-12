import { AppShell, Group, Text, Breadcrumbs, Anchor, Box } from '@mantine/core';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface RecruiterHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  actions?: React.ReactNode;
}

export function RecruiterHeader({ breadcrumbs = [], title, actions }: RecruiterHeaderProps) {
  return (
    <AppShell.Header
      p="md"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color-light)',
      }}
    >
      <Group justify="space-between" align="center" style={{ height: '100%' }}>
        {/* Left Section: Breadcrumbs or Title */}
        <Box>
          {breadcrumbs.length > 0 ? (
            <Breadcrumbs separator="/">
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return isLast ? (
                  <Text key={index} size="sm" fw={500}>
                    {item.title}
                  </Text>
                ) : (
                  <Anchor key={index} href={item.href} size="sm" c="dimmed">
                    {item.title}
                  </Anchor>
                );
              })}
            </Breadcrumbs>
          ) : title ? (
            <Text size="xl" fw={600} style={{ fontFamily: 'var(--font-heading)' }}>
              {title}
            </Text>
          ) : null}
        </Box>

        {/* Right Section: Actions */}
        {actions && <Box>{actions}</Box>}
      </Group>
    </AppShell.Header>
  );
}
