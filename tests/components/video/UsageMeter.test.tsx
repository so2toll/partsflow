/**
 * UsageMeter Component Tests
 *
 * Testing utilities and examples for the UsageMeter component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsageMeter, { validateUsageMeterProps, PlanType } from './UsageMeter';

describe('UsageMeter Component', () => {
  const defaultProps = {
    usedMinutes: 30,
    totalMinutes: 60,
    planType: 'creator' as PlanType,
    periodStart: '2024-01-01T00:00:00Z',
    periodEnd: '2024-02-01T00:00:00Z',
  };

  describe('Rendering', () => {
    it('should render with basic props', () => {
      render(<UsageMeter {...defaultProps} />);
      expect(screen.getByText('Creator')).toBeInTheDocument();
      expect(screen.getByText('30 / 60 min')).toBeInTheDocument();
    });

    it('should render free tier correctly', () => {
      render(
        <UsageMeter
          usedMinutes={2}
          totalMinutes={5}
          planType="free"
        />
      );
      expect(screen.getByText('Free Tier')).toBeInTheDocument();
      expect(screen.getByText('2 / 5 min')).toBeInTheDocument();
    });

    it('should render enterprise plan with unlimited', () => {
      render(
        <UsageMeter
          usedMinutes={1000}
          totalMinutes={999999}
          planType="enterprise"
        />
      );
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
      expect(screen.getByText('1000 / ∞ min')).toBeInTheDocument();
      expect(screen.getByText('Unlimited usage')).toBeInTheDocument();
    });

    it('should render in compact mode', () => {
      const { container } = render(
        <UsageMeter
          {...defaultProps}
          compact
        />
      );
      // Compact mode should not show the toggle button
      expect(container.querySelector('button[aria-label*="details"]')).not.toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <UsageMeter
          {...defaultProps}
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Usage Levels', () => {
    it('should show low usage state (0-49%)', () => {
      render(
        <UsageMeter
          {...defaultProps}
          usedMinutes={20}
          totalMinutes={60}
        />
      );
      expect(screen.getByText('40 minutes remaining')).toBeInTheDocument();
    });

    it('should show medium usage state (50-79%)', () => {
      render(
        <UsageMeter
          {...defaultProps}
          usedMinutes={40}
          totalMinutes={60}
        />
      );
      expect(screen.getByText('20 minutes remaining')).toBeInTheDocument();
    });

    it('should show high usage state (80-99%)', () => {
      const onUpgrade = jest.fn();
      render(
        <UsageMeter
          {...defaultProps}
          usedMinutes={52}
          totalMinutes={60}
          onUpgrade={onUpgrade}
        />
      );
      expect(screen.getByText(/8 minutes remaining/)).toBeInTheDocument();
      expect(screen.getByText('Get More Minutes')).toBeInTheDocument();
    });

    it('should show exceeded usage state (100%+)', () => {
      const onUpgrade = jest.fn();
      render(
        <UsageMeter
          {...defaultProps}
          usedMinutes={70}
          totalMinutes={60}
          onUpgrade={onUpgrade}
        />
      );
      expect(screen.getByText(/Upgrade to continue/)).toBeInTheDocument();
      expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should toggle details when clicked', () => {
      const { container } = render(<UsageMeter {...defaultProps} />);

      const toggleButton = container.querySelector('button[aria-label*="details"]');
      expect(toggleButton).toBeInTheDocument();

      fireEvent.click(toggleButton!);

      expect(screen.getByText('Used this period')).toBeInTheDocument();
      expect(screen.getByText('Remaining')).toBeInTheDocument();
    });

    it('should call onUpgrade when upgrade button is clicked', () => {
      const onUpgrade = jest.fn();
      render(
        <UsageMeter
          {...defaultProps}
          usedMinutes={55}
          totalMinutes={60}
          onUpgrade={onUpgrade}
        />
      );

      const upgradeButton = screen.getByText('Get More Minutes');
      fireEvent.click(upgradeButton);

      expect(onUpgrade).toHaveBeenCalledTimes(1);
    });

    it('should not show upgrade button for enterprise', () => {
      render(
        <UsageMeter
          usedMinutes={1000}
          totalMinutes={999999}
          planType="enterprise"
          onUpgrade={() => {}}
        />
      );
      expect(screen.queryByText('Get More Minutes')).not.toBeInTheDocument();
      expect(screen.queryByText('Upgrade Now')).not.toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should have correct progress percentage', () => {
      const { container } = render(
        <UsageMeter
          {...defaultProps}
          usedMinutes={30}
          totalMinutes={60}
        />
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '30');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '60');
    });

    it('should not show progress bar for enterprise', () => {
      const { container } = render(
        <UsageMeter
          usedMinutes={1000}
          totalMinutes={999999}
          planType="enterprise"
        />
      );
      expect(container.querySelector('[role="progressbar"]')).not.toBeInTheDocument();
    });
  });

  describe('Details Section', () => {
    it('should show billing period information when expanded', () => {
      const { container } = render(
        <UsageMeter
          {...defaultProps}
          periodStart="2024-01-01T00:00:00Z"
          periodEnd="2024-02-01T00:00:00Z"
        />
      );

      const toggleButton = container.querySelector('button[aria-label*="details"]');
      fireEvent.click(toggleButton!);

      expect(screen.getByText(/Jan 1.*Feb 1/)).toBeInTheDocument();
      expect(screen.getByText('Resets in')).toBeInTheDocument();
    });

    it('should calculate days until reset correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const { container } = render(
        <UsageMeter
          {...defaultProps}
          periodEnd={futureDate.toISOString()}
        />
      );

      const toggleButton = container.querySelector('button[aria-label*="details"]');
      fireEvent.click(toggleButton!);

      expect(screen.getByText(/15 days/)).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate correct props', () => {
      const result = validateUsageMeterProps(defaultProps);
      expect(result).toBe(true);
    });

    it('should invalidate negative usedMinutes', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = validateUsageMeterProps({
        ...defaultProps,
        usedMinutes: -10,
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('UsageMeter: usedMinutes cannot be negative');
      consoleSpy.mockRestore();
    });

    it('should invalidate negative totalMinutes', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = validateUsageMeterProps({
        ...defaultProps,
        totalMinutes: -10,
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('UsageMeter: totalMinutes cannot be negative');
      consoleSpy.mockRestore();
    });

    it('should invalidate invalid planType', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = validateUsageMeterProps({
        ...defaultProps,
        planType: 'invalid' as PlanType,
      });
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid planType'));
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const { container } = render(<UsageMeter {...defaultProps} />);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-label', '50% used');
    });

    it('should support keyboard navigation', () => {
      const { container } = render(<UsageMeter {...defaultProps} />);

      const toggleButton = container.querySelector('button[aria-label*="details"]');
      expect(toggleButton).toHaveAttribute('type', 'button');

      toggleButton?.focus();
      expect(toggleButton).toHaveFocus();
    });

    it('should update aria-expanded on toggle', () => {
      const { container } = render(<UsageMeter {...defaultProps} />);

      const toggleButton = container.querySelector('button[aria-label*="details"]');
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggleButton!);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero totalMinutes', () => {
      render(
        <UsageMeter
          {...defaultProps}
          usedMinutes={0}
          totalMinutes={0}
        />
      );
      expect(screen.getByText('0 / 0 min')).toBeInTheDocument();
    });

    it('should handle usedMinutes greater than totalMinutes', () => {
      const { container } = render(
        <UsageMeter
          {...defaultProps}
          usedMinutes={100}
          totalMinutes={60}
        />
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      // Progress should be capped at 100%
      expect(progressBar?.parentElement).toHaveStyle({ width: '100%' });
    });

    it('should handle missing period dates', () => {
      const { container } = render(
        <UsageMeter
          {...defaultProps}
          periodStart={undefined}
          periodEnd={undefined}
        />
      );

      const toggleButton = container.querySelector('button[aria-label*="details"]');
      fireEvent.click(toggleButton!);

      // Should not show period information
      expect(screen.queryByText('Resets in')).not.toBeInTheDocument();
    });
  });
});

/**
 * Manual Testing Checklist
 *
 * Run through this checklist to manually verify the component:
 *
 * Visual Testing:
 * □ Component renders correctly in all plan types
 * □ Progress bar colors change at appropriate thresholds
 * □ Background colors change for warning/danger states
 * □ Text is readable and properly aligned
 * □ Icons display correctly
 *
 * Interaction Testing:
 * □ Toggle button expands/collapses details
 * □ Upgrade button triggers callback
 * □ Component works in compact mode
 * □ Keyboard navigation works (Tab, Enter, Space)
 *
 * Responsive Testing:
 * □ Component works on mobile (320px+)
 * □ Component works on tablet (768px+)
 * □ Component works on desktop (1024px+)
 *
 * Accessibility Testing:
 * □ All interactive elements are keyboard accessible
 * □ Screen reader announces usage correctly
 * □ ARIA labels are present and accurate
 * □ Focus indicators are visible
 * □ Color contrast meets WCAG AA standards
 *
 * Browser Testing:
 * □ Works in Chrome
 * □ Works in Firefox
 * □ Works in Safari
 * □ Works in Edge
 */
