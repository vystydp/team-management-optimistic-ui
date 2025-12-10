import { render, screen, fireEvent } from '@testing-library/react';
import { TeamMemberCard } from '../TeamMemberCard';
import { TeamMember } from '../../../types/team';

describe('TeamMemberCard', () => {
  const mockMember: TeamMember = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Developer',
    department: 'Engineering',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders team member information', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleStatus={mockOnToggleStatus}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('shows active status badge', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleStatus={mockOnToggleStatus}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows optimistic state when isOptimistic is true', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleStatus={mockOnToggleStatus}
        isOptimistic={true}
      />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleStatus={mockOnToggleStatus}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockMember);
  });

  it('calls onToggleStatus when toggle button is clicked', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleStatus={mockOnToggleStatus}
      />
    );

    fireEvent.click(screen.getByText('Toggle'));
    expect(mockOnToggleStatus).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleStatus={mockOnToggleStatus}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('disables buttons when optimistic state is active', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleStatus={mockOnToggleStatus}
        isOptimistic={true}
      />
    );

    expect(screen.getByText('Edit')).toBeDisabled();
    expect(screen.getByText('Toggle')).toBeDisabled();
    expect(screen.getByText('Delete')).toBeDisabled();
  });

  it('applies optimistic styling when isOptimistic is true', () => {
    const { container } = render(
      <TeamMemberCard
        member={mockMember}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggleStatus={mockOnToggleStatus}
        isOptimistic={true}
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('opacity-70');
    expect(card).toHaveClass('ring-optimistic-pending');
  });
});
