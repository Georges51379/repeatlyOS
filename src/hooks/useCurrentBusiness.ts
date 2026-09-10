import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Resolves the `:businessId` route param against the signed-in user's own
 * memberships (from AuthContext, which only ever holds businesses RLS
 * already lets them see). This is a UX convenience for picking what to
 * render — NOT the security boundary. A user typing a different business's
 * id into the URL gets nothing usable here (this returns undefined and the
 * page should redirect), and even if they bypassed the UI entirely, every
 * actual data query is still independently gated by RLS. */
export function useCurrentBusiness() {
  const { businessId } = useParams<{ businessId: string }>();
  const { memberships } = useAuth();
  const membership = memberships.find((m) => m.business_id === businessId);
  return { membership, business: membership?.business };
}
