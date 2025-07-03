import React from 'react';
import { Modal, Button, ListGroup } from 'react-bootstrap';

export interface BotInfo {
  name: string;
  prompt: string;
}

interface Props {
  show: boolean;
  bots: BotInfo[];
  onSelect: (bot: BotInfo) => void;
  onHide: () => void;
}

const BotSelectorModal: React.FC<Props> = ({ show, bots, onSelect, onHide }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Elegir bot</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {bots.length ? (
          <ListGroup className="mb-3">
            {bots.map((b) => (
              <ListGroup.Item
                action
                key={b.name}
                onClick={() => onSelect(b)}
              >
                {b.name}
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p className="text-muted">No hay bots configurados para este canal.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BotSelectorModal;
