import { useState } from 'react';
import { AppShell, NavLink, Group, Stack, Avatar, Text, ActionIcon, Box } from '@mantine/core';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface RecruiterSidebarProps {
  currentPath?: string;
}

export function RecruiterSidebar({ currentPath = '/' }: RecruiterSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/recruiter/dashboard', icon: '📊' },
    { label: 'Interviews', href: '/recruiter/interviews', icon: '📅' },
    { label: 'Candidates', href: '/recruiter/candidates', icon: '👥' },
    { label: 'Assessments', href: '/recruiter/assessment/dashboard', icon: '📝' },
    { label: 'Video Gallery', href: '/recruiter/videos', icon: '🎥' },
    { label: 'Settings', href: '/recruiter/settings', icon: '⚙️' },
  ];

  const isActive = (href: string) => {
    return currentPath === href || currentPath.startsWith(href);
  };

  return (
    <AppShell.Navbar
      p="md"
      style={{
        width: collapsed ? '60px' : '280px',
        transition: 'width 200ms ease',
        backgroundColor: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-color-light)',
      }}
    >
      <Stack style={{ height: '100%' }} justify="space-between">
        {/* Top Section: Logo + Navigation */}
        <Box>
          {/* Logo/Branding */}
          <Group mb="xl" justify={collapsed ? 'center' : 'space-between'}>
            {!collapsed && (
              <Text fw={600} size="lg" style={{ fontFamily: 'var(--font-heading)' }}>
                MotoFlow
              </Text>
            )}
            <ActionIcon
              variant="subtle"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? '→' : '←'}
            </ActionIcon>
          </Group>

          {/* Navigation Links */}
          <Stack gap="xs">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={collapsed ? '' : item.label}
                leftSection={
                  <Text size="lg" style={{ lineHeight: 1 }}>
                    {item.icon}
                  </Text>
                }
                active={isActive(item.href)}
                variant="subtle"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  padding: collapsed ? 'var(--spacing-xs)' : undefined,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                styles={(theme) => ({
                  root: {
                    '&[data-active]': {
                      backgroundColor: 'var(--bg-active)',
                      color: 'var(--color-primary)',
                      fontWeight: 500,
                    },
                    '&:hover': {
                      backgroundColor: 'var(--bg-hover)',
                    },
                  },
                })}
              />
            ))}
          </Stack>
        </Box>

        {/* Bottom Section: User Profile */}
        <Box
          p="sm"
          style={{
            borderTop: '1px solid var(--border-color-light)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <Group gap="sm" wrap="nowrap" justify={collapsed ? 'center' : 'flex-start'}>
            <Avatar
              src={null}
              alt="User Avatar"
              size={collapsed ? 'sm' : 'md'}
              radius="xl"
              color="blue"
            >
              R
            </Avatar>
            {!collapsed && (
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={500} lineClamp={1}>
                  Recruiter
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  recruiter@MotoFlow.com
                </Text>
              </Box>
            )}
          </Group>
        </Box>
      </Stack>
    </AppShell.Navbar>
  );
}
