import { useCurrentBusiness } from '../../hooks/useCurrentBusiness';
import ModulesPanel from '../../components/ModulesPanel';
import PlanPanel from '../../components/PlanPanel';

export default function BusinessSettings() {
  const { business, membership } = useCurrentBusiness();
  if (!business || !membership) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-white font-semibold text-lg mb-1">Settings</h1>
      <p className="text-slate-500 text-sm mb-6">{business.name}</p>

      <PlanPanel businessId={business.id} />

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-white font-medium text-sm mb-1">Modules</h2>
        <p className="text-slate-500 text-xs mb-4">
          {membership.role === 'owner'
            ? 'Enable or disable features for this business.'
            : 'Only the business owner can change these.'}
        </p>
        <ModulesPanel businessId={business.id} canEdit={membership.role === 'owner'} />
      </div>
    </div>
  );
}
