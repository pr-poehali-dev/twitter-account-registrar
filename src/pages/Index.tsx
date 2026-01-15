import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import Icon from '@/components/ui/icon';

interface Account {
  id: string;
  username: string;
  token: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  followers: number;
  following: number;
  tweets: number;
  createdAt: string;
}

const Index = () => {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      username: '@demo_user',
      token: 'Bearer eyJhbGciOiJIUzI1NiIs...',
      email: 'demo@twitter.com',
      status: 'active',
      followers: 1250,
      following: 342,
      tweets: 89,
      createdAt: new Date().toISOString()
    }
  ]);

  const [formData, setFormData] = useState({
    username: '',
    token: '',
    email: ''
  });

  const handleAddAccount = () => {
    if (!formData.username || !formData.token || !formData.email) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive"
      });
      return;
    }

    const newAccount: Account = {
      id: Date.now().toString(),
      username: formData.username,
      token: formData.token,
      email: formData.email,
      status: 'pending',
      followers: 0,
      following: 0,
      tweets: 0,
      createdAt: new Date().toISOString()
    };

    setAccounts([...accounts, newAccount]);
    setFormData({ username: '', token: '', email: '' });
    
    toast({
      title: "✅ Успешно",
      description: "Аккаунт добавлен в базу"
    });
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({
      exportDate: new Date().toISOString(),
      totalAccounts: accounts.length,
      accounts: accounts.map(acc => ({
        ...acc,
        exportedAt: new Date().toISOString()
      }))
    }, null, 2);

    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `twitter-accounts-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "📁 Экспорт завершен",
      description: `Выгружено ${accounts.length} аккаунтов`
    });
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(acc => acc.id !== id));
    toast({
      title: "Удалено",
      description: "Аккаунт удален из базы"
    });
  };

  const totalFollowers = accounts.reduce((sum, acc) => sum + acc.followers, 0);
  const totalTweets = accounts.reduce((sum, acc) => sum + acc.tweets, 0);
  const activeAccounts = accounts.filter(acc => acc.status === 'active').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'suspended': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'pending': return 'Ожидание';
      case 'suspended': return 'Заблокирован';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-2xl animate-pulse-glow">
              <Icon name="Twitter" size={32} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Twitter Manager
            </h1>
          </div>
          <p className="text-muted-foreground text-lg ml-16">Управление аккаунтами и токенами</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-scale-in">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-primary">
                <Icon name="Users" size={18} />
                Всего аккаунтов
              </CardDescription>
              <CardTitle className="text-4xl font-bold">{accounts.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="CheckCircle" size={16} className="text-green-400" />
                {activeAccounts} активных
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/20 bg-gradient-to-br from-card to-secondary/5 hover:border-secondary/40 transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-secondary">
                <Icon name="Heart" size={18} />
                Общие подписчики
              </CardDescription>
              <CardTitle className="text-4xl font-bold">{totalFollowers.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={Math.min((totalFollowers / 10000) * 100, 100)} className="h-2" />
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-accent/5 hover:border-accent/40 transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-accent">
                <Icon name="MessageSquare" size={18} />
                Всего твитов
              </CardDescription>
              <CardTitle className="text-4xl font-bold">{totalTweets.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="TrendingUp" size={16} className="text-accent" />
                {accounts.length > 0 ? Math.round(totalTweets / accounts.length) : 0} среднее
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="accounts" className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Icon name="Users" size={16} />
              Аккаунты
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Icon name="UserPlus" size={16} />
              Добавить
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Icon name="Download" size={16} />
              Экспорт
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="animate-scale-in">
            <Card className="border-2 border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="List" size={24} className="text-primary" />
                  Список аккаунтов
                </CardTitle>
                <CardDescription>Все зарегистрированные Twitter аккаунты</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Имя пользователя</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead className="text-center">Подписчики</TableHead>
                        <TableHead className="text-center">Твиты</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((account) => (
                        <TableRow key={account.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium flex items-center gap-2">
                            <Icon name="User" size={16} className="text-primary" />
                            {account.username}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{account.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(account.status)}>
                              {getStatusText(account.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-secondary">
                            {account.followers.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center font-semibold text-accent">
                            {account.tweets}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id)}
                              className="hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Icon name="Trash2" size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="animate-scale-in">
            <Card className="border-2 border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="UserPlus" size={24} className="text-primary" />
                  Добавить аккаунт
                </CardTitle>
                <CardDescription>Введите данные нового Twitter аккаунта</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <Icon name="AtSign" size={16} className="text-primary" />
                    Имя пользователя
                  </Label>
                  <Input
                    id="username"
                    placeholder="@username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="bg-muted/30 border-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Icon name="Mail" size={16} className="text-secondary" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-muted/30 border-secondary/20 focus:border-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token" className="flex items-center gap-2">
                    <Icon name="Key" size={16} className="text-accent" />
                    API Token
                  </Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Bearer xxxxxxxxxx..."
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    className="bg-muted/30 border-accent/20 focus:border-accent font-mono"
                  />
                </div>

                <Button
                  onClick={handleAddAccount}
                  className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity text-lg h-12 font-semibold"
                >
                  <Icon name="Plus" size={20} className="mr-2" />
                  Добавить аккаунт
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="animate-scale-in">
            <Card className="border-2 border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="FileDown" size={24} className="text-primary" />
                  Экспорт данных
                </CardTitle>
                <CardDescription>Сохраните базу аккаунтов в JSON формате</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-lg border border-primary/10">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Всего аккаунтов</p>
                      <p className="text-3xl font-bold text-primary">{accounts.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Активных</p>
                      <p className="text-3xl font-bold text-green-400">{activeAccounts}</p>
                    </div>
                  </div>
                  <Progress value={(activeAccounts / Math.max(accounts.length, 1)) * 100} className="h-2" />
                </div>

                <div className="bg-card/50 p-4 rounded-lg border border-accent/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2 text-accent">
                    <Icon name="Info" size={18} />
                    Формат экспорта
                  </h4>
                  <code className="text-xs text-muted-foreground block">
                    {`{
  "exportDate": "ISO timestamp",
  "totalAccounts": number,
  "accounts": [...]
}`}
                  </code>
                </div>

                <Button
                  onClick={handleExportJSON}
                  disabled={accounts.length === 0}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg h-12 font-semibold"
                >
                  <Icon name="Download" size={20} className="mr-2" />
                  Скачать JSON ({accounts.length} {accounts.length === 1 ? 'аккаунт' : 'аккаунтов'})
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
