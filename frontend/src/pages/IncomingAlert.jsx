import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, AlertTriangle, ExternalLink } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { Card } from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { incidentsApi } from '../services/api';

const IncomingAlert = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await incidentsApi.getIncoming(id);
      setAlert(data.alert);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageLayout title="SOS alert" subtitle="Emergency notification" backTo="/">
      <div className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {loading && (
          <p className="text-center text-sm text-text-tertiary">Loading alert…</p>
        )}
        {!loading && alert && (
          <>
            <Card className="!border-danger/30 !bg-danger-muted">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/20">
                  <AlertTriangle className="h-5 w-5 text-danger" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-danger">
                    {alert.fromUserName} needs help
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {alert.note && (
                <p className="mt-3 text-sm text-text-secondary">{alert.note}</p>
              )}
            </Card>

            {alert.sharedPhoto?.dataUrl && (
              <Card className="!p-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  Emergency photo
                </p>
                <img
                  src={alert.sharedPhoto.dataUrl}
                  alt="SOS emergency capture"
                  className="w-full rounded-xl border border-border object-cover"
                />
              </Card>
            )}

            {alert.maps && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.open(alert.maps, '_blank', 'noopener')}
              >
                <MapPin className="h-4 w-4" />
                Open location in Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button className="w-full" onClick={() => navigate('/')}>
              Back to dashboard
            </Button>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default IncomingAlert;
