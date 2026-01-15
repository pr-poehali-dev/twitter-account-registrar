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
  status: 'active' | 'pending' | 'suspended' | 'registering' | 'configuring';
  followers: number;
  following: number;
  tweets: number;
  createdAt: string;
  avatar?: string;
  banner?: string;
  lastPost?: string;
  lastPostTime?: string;
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

  const [bulkCount, setBulkCount] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [postText, setPostText] = useState('');
  const [uploadingImages, setUploadingImages] = useState<{avatar?: File, banner?: File}>({});

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

  const handleBulkRegister = async () => {
    if (bulkCount < 1 || bulkCount > 10) {
      toast({
        title: "Ошибка",
        description: "Количество аккаунтов от 1 до 10",
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    const newAccounts: Account[] = [];

    for (let i = 0; i < bulkCount; i++) {
      const timestamp = Date.now() + i;
      const randomNum = Math.floor(Math.random() * 9999);
      
      const newAccount: Account = {
        id: timestamp.toString(),
        username: `@user_${randomNum}`,
        token: `Bearer_auto_${timestamp}`,
        email: `user${randomNum}@gmx.com`,
        status: 'registering',
        followers: 0,
        following: 0,
        tweets: 0,
        createdAt: new Date().toISOString()
      };
      
      newAccounts.push(newAccount);
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setAccounts([...accounts, ...newAccounts]);
    setIsRegistering(false);

    setTimeout(() => {
      setAccounts(prev => prev.map(acc => 
        newAccounts.find(na => na.id === acc.id) 
          ? { ...acc, status: 'active' as const }
          : acc
      ));
    }, 2000);

    toast({
      title: "🎉 Регистрация завершена",
      description: `Создано ${bulkCount} аккаунтов GMX и привязано к Twitter`
    });
  };

  const handleUploadAvatar = async (accountId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, avatar: reader.result as string, status: 'active' as const } : acc
      ));
      toast({
        title: "✅ Аватар загружен",
        description: "Изображение профиля обновлено"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadBanner = async (accountId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, banner: reader.result as string, status: 'active' as const } : acc
      ));
      toast({
        title: "✅ Шапка загружена",
        description: "Обложка профиля обновлена"
      });
    };
    reader.readAsDataURL(file);
  };

  const handlePostTweet = async (accountId: string, text: string) => {
    if (!text.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст поста",
        variant: "destructive"
      });
      return;
    }

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;

    setAccounts(prev => prev.map(acc => 
      acc.id === accountId 
        ? { 
            ...acc, 
            lastPost: text,
            lastPostTime: new Date().toISOString(),
            tweets: acc.tweets + 1,
            status: 'active' as const
          } 
        : acc
    ));

    setPostText('');
    setSelectedAccount(null);

    toast({
      title: "🐦 Пост опубликован",
      description: `Твит от ${account.username} успешно размещен`
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
      case 'registering': return 'bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse';
      case 'configuring': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'pending': return 'Ожидание';
      case 'suspended': return 'Заблокирован';
      case 'registering': return 'Регистрация...';
      case 'configuring': return 'Настройка';
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
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Icon name="Users" size={16} />
              Аккаунты
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Icon name="Zap" size={16} />
              Массовая
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Icon name="Image" size={16} />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="post" className="flex items-center gap-2">
              <Icon name="Send" size={16} />
              Постинг
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
                            <div className="flex items-center justify-end gap-2">
                              {account.avatar && (
                                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/50">
                                  <img src={account.avatar} alt="avatar" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAccount(account)}
                                className="hover:bg-primary/20 hover:text-primary"
                              >
                                <Icon name="Settings" size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAccount(account.id)}
                                className="hover:bg-destructive/20 hover:text-destructive"
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
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

          <TabsContent value="bulk" className="animate-scale-in">
            <Card className="border-2 border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Zap" size={24} className="text-primary" />
                  Массовая регистрация
                </CardTitle>
                <CardDescription>Создайте до 10 аккаунтов GMX одновременно</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-lg border-2 border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-primary rounded-full">
                      <Icon name="Mail" size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">GMX Email Service</h3>
                      <p className="text-sm text-muted-foreground">Автоматическое создание почтовых ящиков</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="CheckCircle" size={16} className="text-green-400" />
                    <span>Привязка к Twitter аккаунтам</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <Icon name="CheckCircle" size={16} className="text-green-400" />
                    <span>Автоматическая верификация</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="bulkCount" className="flex items-center gap-2 text-lg">
                    <Icon name="Users" size={20} className="text-secondary" />
                    Количество аккаунтов (1-10)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="bulkCount"
                      type="number"
                      min="1"
                      max="10"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="text-2xl font-bold text-center h-16 bg-muted/30 border-secondary/20 focus:border-secondary"
                    />
                    <div className="text-muted-foreground">
                      <div className="text-sm">Будет создано:</div>
                      <div className="text-2xl font-bold text-primary">{bulkCount}</div>
                    </div>
                  </div>
                  <Progress value={(bulkCount / 10) * 100} className="h-3" />
                </div>

                <Button
                  onClick={handleBulkRegister}
                  disabled={isRegistering}
                  className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity text-lg h-14 font-semibold"
                >
                  {isRegistering ? (
                    <>
                      <Icon name="Loader2" size={24} className="mr-2 animate-spin" />
                      Регистрация... {bulkCount} аккаунтов
                    </>
                  ) : (
                    <>
                      <Icon name="Sparkles" size={24} className="mr-2" />
                      Создать {bulkCount} {bulkCount === 1 ? 'аккаунт' : 'аккаунтов'}
                    </>
                  )}
                </Button>

                {isRegistering && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 animate-pulse">
                    <p className="text-sm text-blue-400 flex items-center gap-2">
                      <Icon name="Info" size={16} />
                      Создаем аккаунты GMX и привязываем к Twitter...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="animate-scale-in">
            <Card className="border-2 border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Image" size={24} className="text-primary" />
                  Настройка профиля
                </CardTitle>
                <CardDescription>Загрузите аватар и шапку для аккаунта</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedAccount ? (
                  <>
                    <div className="bg-gradient-to-br from-card to-primary/5 p-6 rounded-lg border-2 border-primary/20">
                      <div className="flex items-center gap-4 mb-4">
                        {selectedAccount.avatar ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-primary">
                            <img src={selectedAccount.avatar} alt="avatar" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Icon name="User" size={32} className="text-white" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-xl">{selectedAccount.username}</h3>
                          <p className="text-sm text-muted-foreground">{selectedAccount.email}</p>
                        </div>
                      </div>
                      {selectedAccount.banner && (
                        <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-primary/30">
                          <img src={selectedAccount.banner} alt="banner" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-lg">
                          <Icon name="User" size={18} className="text-primary" />
                          Аватар профиля
                        </Label>
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadAvatar(selectedAccount.id, file);
                            }}
                            className="cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Рекомендуемый размер: 400x400px</p>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-lg">
                          <Icon name="Image" size={18} className="text-secondary" />
                          Шапка профиля
                        </Label>
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadBanner(selectedAccount.id, file);
                            }}
                            className="cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Рекомендуемый размер: 1500x500px</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setSelectedAccount(null)}
                      variant="outline"
                      className="w-full"
                    >
                      <Icon name="Check" size={18} className="mr-2" />
                      Готово
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-block p-6 bg-muted/30 rounded-full mb-4">
                      <Icon name="Image" size={48} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Выберите аккаунт</h3>
                    <p className="text-muted-foreground mb-6">
                      Перейдите во вкладку "Аккаунты" и нажмите на иконку настроек
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-primary">
                      <Icon name="Settings" size={16} />
                      <span>Иконка настроек в таблице аккаунтов</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="post" className="animate-scale-in">
            <Card className="border-2 border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Send" size={24} className="text-primary" />
                  Публикация в Twitter
                </CardTitle>
                <CardDescription>Создайте и опубликуйте пост от выбранного аккаунта</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedAccount ? (
                  <>
                    <div className="bg-gradient-to-br from-card to-secondary/5 p-4 rounded-lg border-2 border-secondary/20">
                      <div className="flex items-center gap-3">
                        {selectedAccount.avatar ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-secondary">
                            <img src={selectedAccount.avatar} alt="avatar" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                            <Icon name="User" size={24} className="text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{selectedAccount.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedAccount.tweets} твитов · {selectedAccount.followers} подписчиков
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postText" className="flex items-center gap-2 text-lg">
                        <Icon name="MessageSquare" size={18} className="text-accent" />
                        Текст поста
                      </Label>
                      <textarea
                        id="postText"
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                        placeholder="Что нового происходит?"
                        maxLength={280}
                        rows={6}
                        className="w-full p-4 bg-muted/30 border-2 border-accent/20 focus:border-accent rounded-lg resize-none focus:outline-none text-lg"
                      />
                      <div className="flex justify-between items-center text-sm">
                        <span className={postText.length > 280 ? 'text-destructive' : 'text-muted-foreground'}>
                          {postText.length} / 280
                        </span>
                        {postText.length > 250 && (
                          <span className="text-warning flex items-center gap-1">
                            <Icon name="AlertTriangle" size={14} />
                            Близко к лимиту
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedAccount.lastPost && (
                      <div className="bg-muted/30 p-4 rounded-lg border border-green-500/30">
                        <p className="text-xs text-green-400 mb-2 flex items-center gap-2">
                          <Icon name="CheckCircle" size={14} />
                          Последний пост
                        </p>
                        <p className="text-sm">{selectedAccount.lastPost}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(selectedAccount.lastPostTime || '').toLocaleString('ru-RU')}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handlePostTweet(selectedAccount.id, postText)}
                        disabled={!postText.trim() || postText.length > 280}
                        className="flex-1 bg-gradient-to-r from-secondary to-accent hover:opacity-90 transition-opacity h-12 font-semibold"
                      >
                        <Icon name="Send" size={18} className="mr-2" />
                        Опубликовать
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedAccount(null);
                          setPostText('');
                        }}
                        variant="outline"
                        className="h-12"
                      >
                        <Icon name="X" size={18} />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-block p-6 bg-muted/30 rounded-full mb-4">
                      <Icon name="Send" size={48} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Выберите аккаунт</h3>
                    <p className="text-muted-foreground mb-6">
                      Перейдите во вкладку "Аккаунты" и нажмите на иконку настроек
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
                      {accounts.slice(0, 4).map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => setSelectedAccount(acc)}
                          className="p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/50 hover:border-primary/50 transition-all flex items-center gap-2"
                        >
                          {acc.avatar ? (
                            <img src={acc.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                              <Icon name="User" size={16} className="text-white" />
                            </div>
                          )}
                          <span className="text-sm font-medium">{acc.username}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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