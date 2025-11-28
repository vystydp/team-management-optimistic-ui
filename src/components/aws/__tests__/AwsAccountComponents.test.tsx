/**
 * Frontend component tests for AWS account components
 * Tests LinkAccountModal, AccountCard, and AwsAccountsPage
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkAccountModal } from '../LinkAccountModal';
import { AccountCard } from '../AccountCard';
import { AwsAccountRef } from '../../../types/aws';

describe('LinkAccountModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(
      <LinkAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Link AWS Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/AWS Account ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/IAM Role ARN/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Owner Email/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <LinkAccountModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should validate account ID format', async () => {
    const user = userEvent.setup();

    render(
      <LinkAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const accountIdInput = screen.getByLabelText(/AWS Account ID/i);
    
    await user.type(accountIdInput, '12345'); // Invalid - too short
    await user.tab(); // Trigger validation

    await waitFor(() => {
      expect(screen.getByText(/must be exactly 12 digits/i)).toBeInTheDocument();
    });
  });

  it('should validate role ARN format', async () => {
    const user = userEvent.setup();

    render(
      <LinkAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const roleArnInput = screen.getByLabelText(/IAM Role ARN/i);
    
    await user.type(roleArnInput, 'invalid-arn');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/Invalid ARN format/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();

    render(
      <LinkAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const emailInput = screen.getByLabelText(/Owner Email/i);
    
    await user.type(emailInput, 'not-an-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
    });
  });

  it('should submit valid form data', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <LinkAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    await user.type(screen.getByLabelText(/AWS Account ID/i), '123456789012');
    await user.type(screen.getByLabelText(/Account Name/i), 'Test Account');
    await user.type(
      screen.getByLabelText(/IAM Role ARN/i),
      'arn:aws:iam::123456789012:role/CrossplaneRole'
    );
    await user.type(screen.getByLabelText(/Owner Email/i), 'test@example.com');

    const linkButton = screen.getByRole('button', { name: /Link Account/i });
    await user.click(linkButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        accountId: '123456789012',
        accountName: 'Test Account',
        roleArn: 'arn:aws:iam::123456789012:role/CrossplaneRole',
        ownerEmail: 'test@example.com',
      });
    });
  });

  it('should display error message on submit failure', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockRejectedValue(new Error('Account already exists'));

    render(
      <LinkAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill valid form
    await user.type(screen.getByLabelText(/AWS Account ID/i), '123456789012');
    await user.type(screen.getByLabelText(/Account Name/i), 'Test Account');
    await user.type(
      screen.getByLabelText(/IAM Role ARN/i),
      'arn:aws:iam::123456789012:role/CrossplaneRole'
    );
    await user.type(screen.getByLabelText(/Owner Email/i), 'test@example.com');

    await user.click(screen.getByRole('button', { name: /Link Account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Account already exists/i)).toBeInTheDocument();
    });
  });

  it('should close modal when cancel button clicked', async () => {
    const user = userEvent.setup();

    render(
      <LinkAccountModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });
});

describe('AccountCard', () => {
  const mockOnSecure = jest.fn();
  const mockOnRemove = jest.fn();

  const baseAccount: AwsAccountRef = {
    id: 'acc-123',
    accountId: '123456789012',
    accountName: 'Test Account',
    roleArn: 'arn:aws:iam::123456789012:role/CrossplaneRole',
    type: 'linked',
    status: 'linked',
    ownerEmail: 'test@example.com',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render account information', () => {
    render(
      <AccountCard
        account={baseAccount}
        onSecure={mockOnSecure}
        onRemove={mockOnRemove}
        isProcessing={false}
      />
    );

    expect(screen.getByText('Test Account')).toBeInTheDocument();
    expect(screen.getByText('123456789012')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should show "Apply Guardrails" button for linked accounts', () => {
    render(
      <AccountCard
        account={baseAccount}
        onSecure={mockOnSecure}
        onRemove={mockOnRemove}
        isProcessing={false}
      />
    );

    expect(screen.getByRole('button', { name: /Apply Guardrails/i })).toBeInTheDocument();
  });

  it('should not show "Apply Guardrails" button for guardrailed accounts', () => {
    const guardrailedAccount = { ...baseAccount, status: 'guardrailed' as const };

    render(
      <AccountCard
        account={guardrailedAccount}
        onSecure={mockOnSecure}
        onRemove={mockOnRemove}
        isProcessing={false}
      />
    );

    expect(screen.queryByRole('button', { name: /Apply Guardrails/i })).not.toBeInTheDocument();
  });

  it('should show loading state for guardrailing accounts', () => {
    const guardrailingAccount = { ...baseAccount, status: 'guardrailing' as const };

    render(
      <AccountCard
        account={guardrailingAccount}
        onSecure={mockOnSecure}
        onRemove={mockOnRemove}
        isProcessing={false}
      />
    );

    expect(screen.getByText(/guardrailing/i)).toBeInTheDocument();
    // Check for loading spinner or icon
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('should show error state with message', () => {
    const errorAccount = {
      ...baseAccount,
      status: 'error' as const,
      errorMessage: 'Failed to create CloudTrail',
    };

    render(
      <AccountCard
        account={errorAccount}
        onSecure={mockOnSecure}
        onRemove={mockOnRemove}
        isProcessing={false}
      />
    );

    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to create CloudTrail/i)).toBeInTheDocument();
  });

  it('should call onSecure when Apply Guardrails clicked', async () => {
    const user = userEvent.setup();

    render(
      <AccountCard
        account={baseAccount}
        onSecure={mockOnSecure}
        onRemove={mockOnRemove}
        isProcessing={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /Apply Guardrails/i }));

    expect(mockOnSecure).toHaveBeenCalledWith('acc-123');
  });

  it('should call onRemove when Remove clicked', async () => {
    const user = userEvent.setup();

    render(
      <AccountCard
        account={baseAccount}
        onSecure={mockOnSecure}
        onRemove={mockOnRemove}
        isProcessing={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /Remove/i }));

    expect(mockOnRemove).toHaveBeenCalledWith('acc-123');
  });

  it('should disable buttons when processing', () => {
    render(
      <AccountCard
        account={baseAccount}
        onSecure={mockOnSecure}
        onRemove={mockOnRemove}
        isProcessing={true}
      />
    );

    expect(screen.getByRole('button', { name: /Apply Guardrails/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Remove/i })).toBeDisabled();
  });

  it('should show success icon for guardrailed accounts', () => {
    const guardrailedAccount = { ...baseAccount, status: 'guardrailed' as const };

    render(
      <AccountCard
        account={guardrailedAccount}
        onSecure={mockOnSecure}
        onRemove={mockOnRemove}
        isProcessing={false}
      />
    );

    expect(screen.getByText(/guardrailed/i)).toBeInTheDocument();
    // Verify success styling or icon
    const statusBadge = screen.getByText(/guardrailed/i).closest('div');
    expect(statusBadge).toHaveClass(/success/i);
  });
});
