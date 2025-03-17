import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import Admin from '../components/Admin';

export default function AdminPage() {
  return (
    <Layout>
      <Dashboard/>
      <Admin/>
    </Layout>
  );
}
