import { useEffect, useState } from 'react';
import { useTeamStore } from '../../stores/teamStore';
import { useTeamMembers } from '../../hooks/useTeamMembers';
import { teamMemberService } from '../../services/teamMemberService';
import { TeamMember } from '../../types/team';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamMemberForm } from './TeamMemberForm';
import { OptimisticUIMonitor } from './OptimisticUIMonitor';
import { PageHeader } from '../../components/shared/PageHeader';
import { ActionButton } from '../../components/shared/ActionButton';
import { PorscheIcon } from '../../components/shared/PorscheIcon';

/**
 * Teams page - Team member management with optimistic UI
 * Displays team members, supports CRUD operations, and shows optimistic updates
 */
export const TeamsPage = () => {
  const setMembers = useTeamStore((state) => state.setMembers);
  const optimisticUpdates = useTeamStore((state) => state.optimisticUpdates);
  const { members, createMember, updateMember, deleteMember, toggleStatus } = useTeamMembers();

  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await teamMemberService.getAll();
        setMembers(data);
      } catch (err) {
        setError('Failed to load team members');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [setMembers]);

  const handleSubmit = async (data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingMember) {
        await updateMember(editingMember.id, data);
      } else {
        await createMember(data);
      }
      handleCloseForm();
    } catch (err) {
      console.error('Operation failed:', err);
      setError('Operation failed. Please try again.');
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMember(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    
    try {
      await deleteMember(id);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Delete failed. Please try again.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatus(id);
    } catch (err) {
      console.error('Toggle status failed:', err);
      setError('Toggle status failed. Please try again.');
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if a member has pending optimistic updates
  const getMemberOptimisticState = (memberId: string) => {
    for (const [, update] of optimisticUpdates) {
      if (update.data.id === memberId) {
        return true;
      }
    }
    return false;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-porsche-canvas">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-porsche-red mx-auto"></div>
          <p className="mt-4 text-porsche-black font-semibold uppercase tracking-wide text-sm font-porsche">
            Loading team members...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-fluid-lg">
      <PageHeader breadcrumb="Platform Operations · Teams View" />

      {/* Hero: Optimistic UI Monitor */}
      <div className="space-y-2">
        <h2 className="text-heading-lg font-bold text-porsche-black font-porsche tracking-tight">
          Optimistic UI Monitor
        </h2>
        <p className="text-sm text-porsche-neutral-600 font-porsche">
          End-to-end request success across all environments and operations
        </p>
        <div className="pt-2">
          <OptimisticUIMonitor />
        </div>
      </div>

      {/* People & Infrastructure Stats */}
      <div>
        <h3 className="text-heading-sm font-bold text-porsche-neutral-800 font-porsche tracking-tight mb-fluid-sm">
          People & Infrastructure
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-fluid-sm">
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs text-porsche-neutral-600 mb-1 uppercase tracking-wide font-semibold font-porsche">
              Total Members
            </div>
            <div className="text-3xl font-bold text-porsche-neutral-800 font-porsche">{members.length}</div>
          </div>
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs text-porsche-neutral-600 mb-1 uppercase tracking-wide font-semibold font-porsche">
              Active
            </div>
            <div className="text-3xl font-bold text-porsche-success font-porsche">
              {members.filter((m) => m.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs text-porsche-neutral-600 mb-1 uppercase tracking-wide font-semibold font-porsche">
              Inactive
            </div>
            <div className="text-3xl font-bold text-porsche-neutral-500 font-porsche">
              {members.filter((m) => m.status === 'inactive').length}
            </div>
          </div>
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs text-porsche-neutral-600 mb-1 uppercase tracking-wide font-semibold font-porsche">
              Environments
            </div>
            <div className="text-3xl font-bold text-porsche-neutral-800 font-porsche">12</div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-fluid-sm">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-porsche-silver rounded-porsche focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 shadow-porsche-sm hover:border-porsche-silver-dark transition-colors bg-white font-porsche"
          />
        </div>
        <div className="flex gap-2">
          <ActionButton variant="secondary" onPress={() => alert('Import CSV feature coming soon')}>
            Import CSV
          </ActionButton>
          <ActionButton variant="primary" icon="add" onPress={() => setShowForm(true)}>
            Add Team Member
          </ActionButton>
        </div>
      </div>

      {/* Content: Members or Empty State */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-porsche-lg shadow-porsche-lg p-12 text-center border border-porsche-silver">
          <div className="text-porsche-neutral-400 mb-4 flex justify-center">
            <PorscheIcon name="userGroup" size={64} className="text-porsche-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-porsche-black mb-2 uppercase tracking-wide font-porsche">
            {searchTerm ? 'No members found' : 'No team members yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first team member'}
          </p>
          {!searchTerm && (
            <ActionButton variant="primary" icon="add" iconSize={20} onPress={() => setShowForm(true)}>
              Add First Member
            </ActionButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-fluid-lg">
          {/* Member Cards */}
          <div>
            <h3 className="text-heading-sm font-bold text-porsche-neutral-800 font-porsche tracking-tight mb-fluid-sm">
              Team Members
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-fluid-sm">
              {filteredMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  isOptimistic={getMemberOptimisticState(member.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          </div>

          {/* Recent Operations Sidebar */}
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <h3 className="text-heading-sm font-bold text-porsche-neutral-800 font-porsche tracking-tight mb-fluid-sm">
              Recent Operations
            </h3>
            <div className="space-y-3">
              {[
                { type: 'environment', action: 'created', name: 'prod-us-east-1', time: '2m ago', icon: 'globe' as const },
                { type: 'account', action: 'secured', name: 'AWS-PROD-001', time: '15m ago', icon: 'success' as const },
                { type: 'deployment', action: 'completed', name: 'api-service v2.1', time: '1h ago', icon: 'check' as const },
                { type: 'environment', action: 'paused', name: 'dev-staging', time: '2h ago', icon: 'warning' as const },
                { type: 'member', action: 'added', name: 'Sarah Chen', time: '3h ago', icon: 'userGroup' as const },
              ].map((op, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2 rounded-porsche hover:bg-porsche-shading transition-colors cursor-pointer"
                >
                  <div className="mt-0.5">
                    <PorscheIcon name={op.icon} size={16} className="text-porsche-neutral-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wide text-porsche-neutral-600 font-porsche">
                      {op.type}
                    </div>
                    <div className="text-sm font-semibold text-porsche-neutral-800 font-porsche truncate">
                      {op.action} · {op.name}
                    </div>
                    <div className="text-xs text-porsche-neutral-500 font-porsche">{op.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-fluid-sm px-4 py-2 text-xs font-bold uppercase tracking-wide text-porsche-neutral-700 hover:text-porsche-red transition-colors font-porsche">
              View All Operations →
            </button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <TeamMemberForm
          member={editingMember}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-porsche-error text-white px-6 py-3 rounded-porsche shadow-porsche-lg">
          {error}
        </div>
      )}
    </div>
  );
};
