import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Item } from '../../types/item';

export function ItemListTable({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <Card className="text-muted-foreground px-5 py-10 text-center text-sm">
        No items yet. Add your first one above.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Batches</TableHead>
            <TableHead>Consumption rate</TableHead>
            <TableHead>Recurring supply</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Link to={`/items/${item.id}`} className="font-medium hover:underline">
                  {item.name}
                </Link>
                {item.isArchived && (
                  <Badge variant="secondary" className="ml-2">
                    Archived
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{item.unit}</TableCell>
              <TableCell className="text-muted-foreground">{item.batches.length}</TableCell>
              <TableCell className="text-muted-foreground">
                {item.consumptionRate ? (
                  `${item.consumptionRate.ratePerPeriod} / ${item.consumptionRate.periodUnit.toLowerCase()}`
                ) : (
                  <Badge variant="warning">Not set</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.recurringSupplySchedule
                  ? `${item.recurringSupplySchedule.quantityPerDelivery} every ${item.recurringSupplySchedule.intervalValue} ${item.recurringSupplySchedule.intervalUnit.toLowerCase()}(s)`
                  : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
