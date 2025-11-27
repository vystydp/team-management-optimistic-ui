import { useEffect, useState } from 'react';
import { useTeamStore } from './stores/teamStore';
import { TeamMemberCard } from './components/TeamMemberCard';
import { TeamMemberForm } from './components/TeamMemberForm';
import { OptimisticUIMonitor } from './components/OptimisticUIMonitor';
import { useTeamMembers } from './hooks/useTeamMembers';
import { teamMemberService } from './services/teamMemberService';
import { TeamMember } from './types/team';

function App() {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-medium">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Team Management</h1>
          <p className="text-gray-600">
            Advanced optimistic UI with predictive analytics and intelligent rollback
          </p>
        </div>
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input type="text" placeholder="Search team members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
          </div>
          <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md transition-colors">➕ Add Team Member</button>
        </div>
        <div className="mb-6">
          <OptimisticUIMonitor />
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Total Members</div>
            <div className="text-2xl font-bold text-gray-900">{members.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {members.filter((m) => m.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Inactive</div>
            <div className="text-2xl font-bold text-gray-600">
              {members.filter((m) => m.status === 'inactive').length}
            </div>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No members found' : 'No team members yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first team member'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Member
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        )}
      </div>

      {showForm && (
        <TeamMemberForm member={editingMember} onSubmit={handleSubmit} onCancel={handleCloseForm} />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-700 hover:text-red-900 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;