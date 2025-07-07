import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Modal, Toast, ToastContainer, Spinner } from 'react-bootstrap';
import useChannels from '../../features/company/hooks/useChannels';
import { messageService } from '../../features/company/services/message.service';



const BotManager: React.FC = () => {
  // Toast notification state
  const [toastMsg, setToastMsg] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger' | 'info'>('info');
  const [showToast, setShowToast] = useState(false);

  const showNotification = (msg: string, variant: 'success' | 'danger' | 'info' = 'info') => {
    setToastMsg(msg);
    setToastVariant(variant);
    setShowToast(true);
  };
  const [showConfirm, setShowConfirm] = useState(false);
  const { channels } = useChannels();
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [channelId, setChannelId] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Estados para filtros de estadísticas
  const [statsChannelId, setStatsChannelId] = useState('');
  const [statsBots, setStatsBots] = useState<Record<string, { Prompt: string }>>({});
  const [statsSelectedBot, setStatsSelectedBot] = useState('');
  const [botSearch, setBotSearch] = useState('');
  const [messagesSent, setMessagesSent] = useState(0);
  const [peakHour, setPeakHour] = useState('--:--');
  const [efficiency, setEfficiency] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [deleting, setDeleting] = useState(false);
  
  // Verificar rol del usuario para determinar permisos
  const userLS = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  
  // Verificar si es rol empleado
  const isEmpleadoRole = userLS.rol?.toLowerCase() === 'empleado';

  // Cargar bots para estadísticas cuando se selecciona una conversación
  useEffect(() => {
    const loadStatsBots = async () => {
      if (!statsChannelId) {
        setStatsBots({});
        setStatsSelectedBot('');
        return;
      }
      try {
        const msg = await messageService.getMessageByDocumentId(statsChannelId);
        const raw = (msg as unknown as Record<string, unknown>)?.bot_interaction ?? msg?.attributes?.bot_interaction ?? {};
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        setStatsBots(parsed);
        setStatsSelectedBot(Object.keys(parsed)[0] ?? '');
      } catch {
        // ignore
      }
    };
    loadStatsBots();
  }, [statsChannelId]);

  // Función para actualizar las estadísticas
  const updateStats = async () => {
    if (!statsChannelId || !statsSelectedBot) return;
    try {
      const msg = await messageService.getMessageByDocumentId(statsChannelId) as unknown as Record<string, unknown>;
      // @ts-expect-error - Dynamic property access on unknown type
      const content = ((msg as Record<string, unknown>)?.content as unknown[]) ?? ((msg as Record<string, unknown>)?.attributes?.content as unknown[]) ?? [];

      // Total de mensajes enviados por el bot seleccionado
      // @ts-expect-error - Dynamic property access on unknown type
      const botMessages = content.filter((c: Record<string, unknown>) => {
        // @ts-expect-error - Dynamic property access on unknown type
        const senderName = ((c as Record<string, unknown>)?.sender_info as Record<string, unknown>)?.nombre ?? (c as Record<string, unknown>)?.sender;
        return senderName === statsSelectedBot;
      });
      setMessagesSent(botMessages.length);
      setTotalMessages(content.length);

      // Hora pico de mensajes (muy simplificado)
      const hourCounts: Record<string, number> = {};
      // @ts-expect-error - Dynamic property access on unknown type
      content.forEach((c: Record<string, unknown>) => {
        // @ts-expect-error - Dynamic property access on unknown type
        const horaStr: string | undefined = ((c as Record<string, unknown>)?.sender_info as Record<string, unknown>)?.hora as string | undefined;
        if (!horaStr) return;
        const timePart = horaStr.split(',')[1]?.trim(); // Ej: "21:12"
        const hour = timePart?.split(':')[0];
        if (!hour) return;
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const peakHourKey = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      setPeakHour(peakHourKey ? `${peakHourKey}:00` : '--:--');

      // Construir data para gráfico (comentado por ahora)
      // const sortedHours = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'));
      // const countsPerHour = sortedHours.map(h => hourCounts[h] || 0);
      // setChartData({
      //   labels: sortedHours,
      //   datasets: [
      //     {
      //       label: 'Mensajes',
      //       data: countsPerHour,
      //       backgroundColor: 'rgba(75, 192, 192, 0.6)',
      //       borderColor: 'rgba(75, 192, 192, 1)',
      //       borderWidth: 1,
      //     },
      //   ],
      // });

      // Eficiencia laboral aleatoria (solo demo)
      const randomEff = Math.floor(70 + Math.random() * 30);
      setEfficiency(randomEff);
    } catch (error) {
      console.error('Error al actualizar estadísticas:', error);
    }
  };

  // Elimina el bot seleccionado del canal en Strapi
  const deleteBot = async () => {
    console.log('deleteBot handler invoked', { statsChannelId, statsSelectedBot });
    if (!statsChannelId || !statsSelectedBot) {
      console.warn('deleteBot aborted: missing selection', { statsChannelId, statsSelectedBot });
      return;
    }
    if (!statsChannelId || !statsSelectedBot) return;
    setShowConfirm(false);
    console.log('Procediendo a eliminar bot');
    try {
      setDeleting(true);
      
      // Delay artificial para hacer la demo más realista (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Obtener bots actuales del canal
      const msg = await messageService.getMessageByDocumentId(statsChannelId);
      const raw = (msg as unknown as Record<string, unknown>)?.bot_interaction ?? msg?.attributes?.bot_interaction ?? {};
      const bots: Record<string, { Prompt: string }> = typeof raw === 'string' ? JSON.parse(raw) : { ...raw };

      // Remover bot
      delete bots[statsSelectedBot];
      console.log('Bots restantes después de eliminar:', bots);
      // Persistir cambios en backend
      await messageService.updateBotsByDocumentId(statsChannelId, bots);
      console.log('Bot eliminado en backend');
      // Feedback y actualización de estado local
      showNotification('Bot eliminado correctamente', 'danger');
      setStatsBots(bots);
      setStatsSelectedBot('');
      setMessagesSent(0);
      setTotalMessages(0);
      setPeakHour('--:--');
      setEfficiency(0);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
      <h2 style={{ color: 'var(--color-text-primary)' }}>Administrar Bots</h2>
      
      {/* Formulario para crear bot - Solo visible si NO es empleado */}
      {!isEmpleadoRole && (
        <Card className="mb-4">
          <Card.Header>Crear nuevo bot</Card.Header>
          <Card.Body>
            <Form>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Nombre</Form.Label>
                    <Form.Control value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Bot Soporte" />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Canal</Form.Label>
                    <Form.Select value={channelId} onChange={e => setChannelId(e.target.value)}>
                      <option value="">Seleccionar…</option>
                      {channels.filter(c => c.type === 'channel' || c.type === 'group' || c.type === 'event').map(c => (
                        <option key={c.id} value={c.documentId}>{c.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button 
                    disabled={!name || !prompt || !channelId || saving} 
                    variant={saving ? "outline-primary" : "primary"}
                    onClick={async () => {
                      try {
                        setSaving(true);
                        
                        // Delay artificial para hacer la demo más realista (2.5 segundos)
                        await new Promise(resolve => setTimeout(resolve, 2500));
                        
                        // 1. Obtener registro actual
                        const msg = await messageService.getMessageByDocumentId(channelId);
                        const existingBotsRaw = (msg as unknown as Record<string, unknown>)?.bot_interaction ?? msg?.attributes?.bot_interaction ?? {};
                        const existingBots = typeof existingBotsRaw === 'string' ? JSON.parse(existingBotsRaw) : existingBotsRaw;
                        const updatedBotInteraction = { ...existingBots, [name]: { Prompt: prompt } };
                        await messageService.updateBotsByDocumentId(channelId, updatedBotInteraction);
                        showNotification('Bot agregado correctamente', 'success');
                        setName('');
                        setPrompt('');
                      } catch (error) {
                        alert((error as Error).message);
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Creando bot...
                      </>
                    ) : (
                      'Guardar'
                    )}
                  </Button>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Prompt (instrucciones)</Form.Label>
                    <Form.Control as="textarea" rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ej: Responde preguntas frecuentes sobre…" />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Estadísticas */}
      <h4 className="mb-3">Estadísticas de Bots</h4>

      <Row className="g-3">
        {/* Filtros */}
        <Col md={3}>
          <Card>
            <Card.Body>
              <Form.Group>
                <Form.Label>Canal</Form.Label>
                <Form.Select value={statsChannelId} onChange={e => setStatsChannelId(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {channels.filter(c => c.type === 'channel' || c.type === 'group' || c.type === 'event').map(c => (
                    <option key={c.id} value={c.documentId}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Búsqueda</Form.Label>
                <Form.Control value={botSearch} onChange={e => setBotSearch(e.target.value)} placeholder="Filtrar bots..." />
              </Form.Group>
              <Form.Group>
                <Form.Label>Bot</Form.Label>
                <Form.Select value={statsSelectedBot} onChange={e => setStatsSelectedBot(e.target.value)} disabled={!statsChannelId}>
                  {Object.keys(statsBots)
                    .filter(nameKey => nameKey.toLowerCase().includes(botSearch.toLowerCase()))
                    .map(nameKey => (
                      <option key={nameKey} value={nameKey}>{nameKey}</option>
                    ))}
                </Form.Select>
              </Form.Group>
              <Button className="mt-3 w-100" variant="secondary" disabled={!statsChannelId || !statsSelectedBot} onClick={updateStats}>Actualizar datos</Button>
              <Button 
                className="mt-2 w-100" 
                variant={deleting ? "outline-danger" : "danger"} 
                disabled={!statsChannelId || !statsSelectedBot || deleting} 
                onClick={() => setShowConfirm(true)}
              >
                {deleting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Eliminando bot...
                  </>
                ) : (
                  'Eliminar bot'
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
        {/* Tarjetas de estadísticas */}
        <Col md={3}>
          <Card>
            <Card.Body className="text-center">
              <h5>Mensajes enviados</h5>
              <p style={{ fontSize: '2rem', margin: 0 }}>{messagesSent}</p>
            </Card.Body>
          </Card>
        </Col>
        {/* Mensajes totales */}
        <Col md={3}>
          <Card>
            <Card.Body className="text-center">
              <h5>Mensajes totales</h5>
              <p style={{ fontSize: '2rem', margin: 0 }}>{totalMessages}</p>
            </Card.Body>
          </Card>
        </Col>
        {/* Hora pico */}
        <Col md={3}>
          <Card>
            <Card.Body className="text-center">
              <h5>Hora pico de mensajes</h5>
              <p style={{ fontSize: '2rem', margin: 0 }}>{peakHour}</p>
            </Card.Body>
          </Card>
        </Col>
        {/* Eficiencia */}
        <Col md={3}>
          <Card>
            <Card.Body className="text-center">
              <h5>Eficiencia laboral en la última sesión</h5>
              <p style={{ fontSize: '2rem', margin: 0 }}>{efficiency}%</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    {/* Modal de confirmación */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar el bot <strong>{statsSelectedBot}</strong>? Esta acción es irreversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancelar</Button>
          <Button variant="danger" onClick={deleteBot}>Eliminar</Button>
        </Modal.Footer>
      </Modal>

      {/* Toast notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toastVariant} onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
          <Toast.Header closeButton={false} className="text-white" style={{ backgroundColor: toastVariant === 'success' ? '#198754' : toastVariant === 'danger' ? '#dc3545' : '#0d6efd' }}>
            <strong className="me-auto">{toastVariant === 'success' ? 'Éxito' : toastVariant === 'danger' ? 'Eliminado' : 'Info'}</strong>
          </Toast.Header>
          <Toast.Body>{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default BotManager;
